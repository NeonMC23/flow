import argparse
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


def run_web(port: int):
    os.chdir(Path(__file__).resolve().parent)
    httpd = ThreadingHTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler)
    print(f"Web server running on http://127.0.0.1:{port} \n")
    httpd.serve_forever()


def run_upload(port: int):
    from scripts.upload_server import Handler
    from http.server import HTTPServer

    httpd = HTTPServer(("127.0.0.1", port), Handler)
    print(f"Upload server running on http://127.0.0.1:{port} \n")
    httpd.serve_forever()


def main():
    parser = argparse.ArgumentParser(description="Start Flow local servers")
    parser.add_argument("--web", type=int, default=5500)
    parser.add_argument("--upload", type=int, default=8001)
    args = parser.parse_args()

    web_thread = threading.Thread(target=run_web, args=(args.web,), daemon=True)
    upload_thread = threading.Thread(target=run_upload, args=(args.upload,), daemon=True)

    web_thread.start()
    upload_thread.start()

    web_thread.join()


if __name__ == "__main__":
    main()
