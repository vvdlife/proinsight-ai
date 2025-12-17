from http.server import BaseHTTPRequestHandler
import json
import yfinance as yf
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 1. Define Tickers
            # Gold (GC=F), Copper (HG=F), Lithium (LIT - ETF Proxy)
            # NVDA, AAPL, Samsung (005930.KS), Naver (035420.KS)
            tickers = {
                "GC=F": "Gold",
                "HG=F": "Copper",
                "LIT": "Lithium(ETF)", 
                "NVDA": "NVIDIA",
                "AAPL": "Apple",
                "005930.KS": "Samsung Elec",
                "035420.KS": "Naver",
                "^KS11": "KOSPI",
                "^GSPC": "S&P 500",
                "KRW=X": "USD/KRW"
            }
            
            # 2. Fetch Data
            data = yf.Tickers(" ".join(tickers.keys()))
            
            results = []
            for symbol, name in tickers.items():
                try:
                    info = data.tickers[symbol].fast_info
                    # Fallback to .info if fast_info misses (sometimes happens)
                    
                    price = info.last_price
                    prev_close = info.previous_close
                    
                    if price and prev_close:
                        change = price - prev_close
                        current_change_percent = (change / prev_close) * 100
                        
                        results.append({
                            "symbol": symbol,
                            "name": name,
                            "price": price,
                            "change": change,
                            "changePercent": current_change_percent,
                            "currency": info.currency
                        })
                except Exception as e:
                    print(f"Error fetching {symbol}: {e}")
                    continue

            # 3. Response Construction
            response_body = json.dumps({
                "timestamp": datetime.now().isoformat(),
                "data": results,
                "status": "success"
            })

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            # CRITICAL: Edge Caching for 5 minutes (300 seconds)
            self.send_header('Cache-Control', 'public, s-maxage=300') 
            self.end_headers()
            self.wfile.write(response_body.encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_msg = json.dumps({"status": "error", "message": str(e)})
            self.wfile.write(error_msg.encode('utf-8'))
