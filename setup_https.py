#!/usr/bin/env python3
"""
Script para configurar servidor HTTPS local para PWA
Necesario para instalar PWA en Android (requiere HTTPS)
"""

import http.server
import ssl
import socketserver
import os
import subprocess
import sys

def create_self_signed_cert():
    """Crear certificado SSL autofirmado"""
    if not os.path.exists('server.crt') or not os.path.exists('server.key'):
        print("🔐 Creando certificado SSL autofirmado...")
        try:
            # Comando para crear certificado autofirmado
            cmd = [
                'openssl', 'req', '-x509', '-newkey', 'rsa:4096', 
                '-keyout', 'server.key', '-out', 'server.crt', 
                '-days', '365', '-nodes', '-subj', 
                '/C=ES/ST=Madrid/L=Madrid/O=AgendaPWA/CN=localhost'
            ]
            subprocess.run(cmd, check=True, capture_output=True)
            print("✅ Certificado SSL creado exitosamente")
        except subprocess.CalledProcessError:
            print("❌ Error: OpenSSL no está instalado o disponible")
            print("💡 Alternativa: Usar ngrok o similar para HTTPS")
            return False
        except FileNotFoundError:
            print("❌ Error: OpenSSL no encontrado en el sistema")
            print("💡 Instala OpenSSL o usa una alternativa como ngrok")
            return False
    else:
        print("✅ Certificado SSL ya existe")
    return True

def start_https_server():
    """Iniciar servidor HTTPS"""
    PORT = 8443
    
    # Crear certificado si no existe
    if not create_self_signed_cert():
        print("\n🔄 Iniciando servidor HTTP (sin HTTPS)...")
        print("⚠️  Para instalar PWA en Android necesitas HTTPS")
        print("💡 Considera usar ngrok: https://ngrok.com/")
        return start_http_server()
    
    # Configurar servidor HTTPS
    handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        # Configurar SSL
        httpd.socket = ssl.wrap_socket(
            httpd.socket,
            certfile='server.crt',
            keyfile='server.key',
            server_side=True
        )
        
        print(f"🚀 Servidor HTTPS iniciado en https://localhost:{PORT}")
        print(f"📱 Para Android: https://[TU_IP_LOCAL]:{PORT}")
        print("🔍 Encuentra tu IP local con: ipconfig (Windows) o ifconfig (Linux/Mac)")
        print("\n📋 Pasos para instalar en Android:")
        print("1. Conecta Android a la misma red WiFi")
        print("2. Abre Chrome en Android")
        print("3. Ve a https://[TU_IP]:8443")
        print("4. Acepta el certificado (avanzado → continuar)")
        print("5. Busca el ícono 'Instalar' en la barra de direcciones")
        print("6. ¡Instala la PWA!")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor detenido")

def start_http_server():
    """Iniciar servidor HTTP simple"""
    PORT = 8000
    handler = http.server.SimpleHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"🌐 Servidor HTTP iniciado en http://localhost:{PORT}")
        print("⚠️  Para instalar PWA en Android necesitas HTTPS")
        print("💡 Usa ngrok: ngrok http 8000")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor detenido")

if __name__ == "__main__":
    print("🎯 Configurando servidor para PWA Android")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--http":
        start_http_server()
    else:
        start_https_server()
