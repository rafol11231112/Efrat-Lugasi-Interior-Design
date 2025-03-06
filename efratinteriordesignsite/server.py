from http.server import HTTPServer, SimpleHTTPRequestHandler
import webbrowser
import os
import requests
import json
from base64 import b64encode
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class ForgeConfig:
    CLIENT_ID = "zdqrck6fhn1aRfxBRTALl4p6PycsCXCFNVu0BeEQAsADmOOI"
    CLIENT_SECRET = "7AtpwGyeEwwMKn8KjFu8pX3GpAuEO2sAD4522zs8YyQssXxVIhW1HhvgVBwbSBXw"
    SCOPE = "data:read data:write data:create bucket:read bucket:create"
    AUTH_URL = "https://developer.api.autodesk.com/authentication/v2/token"
    BUCKET_KEY = 'my_design_bucket_' + CLIENT_ID.lower()[:8]
    OSS_URL = 'https://developer.api.autodesk.com/oss/v2'
    UPLOAD_URL = 'https://developer.api.autodesk.com/oss/v2/buckets/{bucket}/objects/{object}'
    MODEL_DERIVATIVE_V2_URL = 'https://developer.api.autodesk.com/modelderivative/v2/designdata'

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        print(f"Received GET request for: {self.path}")
        
        # Serve static files from the models and images directories
        if self.path.startswith('/models/') or self.path.startswith('/images/'):
            try:
                file_path = os.path.join(os.getcwd(), self.path[1:])
                print(f"Looking for file at: {file_path}")
                
                if not os.path.exists(file_path):
                    print(f"File not found: {file_path}")
                    self.send_error(404, f'File Not Found: {file_path}')
                    return
                
                file_size = os.path.getsize(file_path)
                print(f"File exists, size: {file_size} bytes")
                
                f = open(file_path, 'rb')
                self.send_response(200)
                # Set correct content type based on file extension
                if self.path.endswith(('.png', '.jpg', '.jpeg')):
                    self.send_header('Content-type', f'image/{self.path.split(".")[-1]}')
                elif self.path.endswith('.webp'):
                    self.send_header('Content-type', 'image/webp')
                else:
                    self.send_header('Content-type', 'application/octet-stream')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Length', str(file_size))
                self.send_header('Cache-Control', 'no-cache')
                self.send_header('Access-Control-Allow-Headers', '*')
                self.end_headers()
                
                self.wfile.write(f.read())
                f.close()
                print(f"File served successfully: {file_path}")
                return
            except Exception as e:
                import traceback
                print(f"Error serving file: {str(e)}")
                print(traceback.format_exc())
                self.send_error(404, f'Error serving file: {str(e)}')
                return
        
        if self.path == '/api/forge/token':
            token = forge_service.get_token()
            if token:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'access_token': token}).encode())
                return
            else:
                self.send_response(500)
                self.end_headers()
                return
        
        if self.path == '/api/forge/models':
            models = []
            for file_path, urn in forge_service.translated_models.items():
                models.append({
                    'name': os.path.basename(file_path),
                    'path': file_path,
                    'urn': urn
                })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(models).encode())
            return
        
        if self.path == '/api/models':
            models_dir = 'models'
            models = []
            if os.path.exists(models_dir):
                for file in os.listdir(models_dir):
                    if file.endswith('.fbx'):
                        models.append({
                            'name': file,
                            'path': f'/models/{file}',
                            'type': 'fbx'
                        })
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(models).encode())
            return
        
        return super().do_GET()

    def do_POST(self):
        if self.path == '/upload':
            try:
                content_length = int(self.headers['Content-Length'])
                file_content = self.rfile.read(content_length)
                
                if not os.path.exists('models'):
                    os.makedirs('models')
                
                file_path = os.path.join('models', 'model.rvt')
                with open(file_path, 'wb') as f:
                    f.write(file_content)

                urn = forge_service.upload_and_translate(file_path)
                if not urn:
                    raise Exception("Failed to process file")

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'urn': urn}).encode())
            
            except Exception as e:
                print(f"Upload error: {str(e)}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())

        elif self.path == '/send-email':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            form_data = json.loads(post_data.decode('utf-8'))
            
            # Email configuration
            sender_email = "refaellugasi10@gmail.com"  # Replace with your Gmail
            sender_password = "xhpy nded imfp ygtc"   # Replace with your Gmail app password
            receiver_email = "efratlugazy@gmail.com"

            # Create the email
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = receiver_email
            msg['Subject'] = f"New Design Inquiry from {form_data['name']}"
            
            # Create a beautiful HTML email body
            html = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2a2a72; border-bottom: 2px solid #009ffd; padding-bottom: 10px;">
                            New Design Inquiry
                        </h2>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #2a2a72; margin-bottom: 15px;">Client Details:</h3>
                            <p><strong>Name:</strong> {form_data['name']}</p>
                            <p><strong>Email:</strong> {form_data['email']}</p>
                            <p><strong>Service:</strong> {form_data['service']}</p>
                        </div>
                        <div style="background: #fff; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
                            <h3 style="color: #2a2a72; margin-bottom: 15px;">Message:</h3>
                            <p style="white-space: pre-line;">{form_data['message']}</p>
                        </div>
                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
                            <p>This email was sent from your website's contact form.</p>
                        </div>
                    </div>
                </body>
            </html>
            """
            
            msg.attach(MIMEText(html, 'html'))
            
            try:
                # Create SMTP session
                with smtplib.SMTP('smtp.gmail.com', 587) as server:
                    server.starttls()
                    server.login(sender_email, sender_password)
                    server.send_message(msg)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
                
            except Exception as e:
                print(f"Error sending email: {str(e)}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode())
                
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

class ForgeService:
    def __init__(self):
        self.token = None
        self.translated_models = {}

    def get_token(self):
        try:
            data = {
                'client_id': ForgeConfig.CLIENT_ID,
                'client_secret': ForgeConfig.CLIENT_SECRET,
                'grant_type': 'client_credentials',
                'scope': ForgeConfig.SCOPE
            }
            
            headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            print("Requesting token...")
            response = requests.post(
                ForgeConfig.AUTH_URL,
                data=data,
                headers=headers
            )
            
            if response.ok:
                token_data = response.json()
                self.token = token_data['access_token']
                print("Token obtained successfully")
                return self.token
            else:
                print(f"Token request failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error getting token: {str(e)}")
            return None

    def create_bucket(self):
        try:
            token = self.get_token()
            if not token:
                return False

            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'bucketKey': ForgeConfig.BUCKET_KEY,
                'policyKey': 'transient'
            }
            
            print(f"Creating bucket: {ForgeConfig.BUCKET_KEY}")
            response = requests.post(
                f'{ForgeConfig.OSS_URL}/buckets',
                headers=headers,
                json=data
            )
            
            if response.ok or response.status_code == 409:
                print("Bucket ready")
                return True
            else:
                print(f"Bucket creation failed: {response.text}")
                return False
                
        except Exception as e:
            print(f"Error creating bucket: {str(e)}")
            return False

    def upload_and_translate(self, file_path):
        try:
            if not os.path.exists(file_path):
                print(f"File not found: {file_path}")
                return None

            token = self.get_token()
            if not token:
                return None

            if not self.create_bucket():
                return None

            file_name = os.path.basename(file_path)
            safe_file_name = file_name.encode('ascii', 'ignore').decode('ascii')
            if not safe_file_name:
                safe_file_name = 'model.rvt'

            print(f"Uploading: {file_name}")
            
            upload_url = ForgeConfig.UPLOAD_URL.format(
                bucket=ForgeConfig.BUCKET_KEY,
                object=safe_file_name
            )

            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/octet-stream'
            }

            with open(file_path, 'rb') as f:
                file_size = os.path.getsize(file_path)
                headers['Content-Length'] = str(file_size)
                
                response = requests.put(
                    upload_url,
                    headers=headers,
                    data=f
                )
                
            if not response.ok:
                print(f"Upload failed: {response.text}")
                return None

            object_id = response.json()['objectId']
            print(f"Upload successful. Object ID: {object_id}")
            
            urn = b64encode(object_id.encode()).decode('utf-8')
            
            print("Starting translation...")
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'input': {
                    'urn': urn,
                    'compressedUrn': False,
                    'rootFilename': safe_file_name
                },
                'output': {
                    'formats': [
                        {
                            'type': 'svf2',
                            'views': ['2d', '3d'],
                            'advanced': {
                                'generateMasterViews': True
                            }
                        }
                    ]
                }
            }
            
            response = requests.post(
                f'{ForgeConfig.MODEL_DERIVATIVE_V2_URL}/job',
                headers=headers,
                json=data
            )

            if response.ok:
                print(f"Translation started for {file_name}")
                self.translated_models[file_path] = urn
                
                while True:
                    status = self.get_translation_status(urn)
                    print(f"Translation status: {status}")
                    if status == 'success':
                        print(f"Translation completed for {file_name}")
                        return urn
                    elif status == 'failed':
                        print(f"Translation failed for {file_name}")
                        return None
                    time.sleep(5)
            else:
                print(f"Translation failed: {response.text}")
                return None
                
        except Exception as e:
            print(f"Error in upload_and_translate: {str(e)}")
            return None

    def get_translation_status(self, urn):
        try:
            token = self.get_token()
            if not token:
                return 'failed'

            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            response = requests.get(
                f'{ForgeConfig.MODEL_DERIVATIVE_V2_URL}/{urn}/manifest',
                headers=headers
            )
            
            if response.ok:
                return response.json()['status']
            return 'failed'
        except Exception as e:
            print(f"Error checking translation status: {str(e)}")
            return 'failed'

def translate_existing_models():
    models_dir = 'models'
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
        return

    print("Processing existing Revit files...")
    for file in os.listdir(models_dir):
        if file.endswith('.rvt'):
            file_path = os.path.join(models_dir, file)
            print(f"Processing {file}...")
            urn = forge_service.upload_and_translate(file_path)
            if urn:
                while True:
                    status = forge_service.get_translation_status(urn)
                    print(f"Translation status: {status}")
                    if status in ['success', 'failed']:
                        break
                    time.sleep(5)

forge_service = ForgeService()

def run_server(port=8000):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(current_dir)
    
    print("Initializing Forge service...")
    translate_existing_models()
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, CustomHandler)
    
    print(f"\nServer started at http://localhost:{port}")
    print("Press Ctrl+C to stop the server")
    
    webbrowser.open(f'http://localhost:{port}')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    run_server() 