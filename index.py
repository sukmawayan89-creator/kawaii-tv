import urllib.request
import urllib.parse
import re
import json
import os
import concurrent.futures
from flask import Flask, jsonify, request, Response, send_from_directory

app = Flask(__name__)

M3U_URL = 'https://raw.githubusercontent.com/dhasap/dhanytv/main/dhanytv.m3u'
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = CURRENT_DIR if os.path.exists(os.path.join(CURRENT_DIR, 'index.html')) else os.path.dirname(CURRENT_DIR)

def extract_headers_static(raw_url):
    target_url = raw_url
    custom_headers = {}
    if '|' in raw_url:
        parts = raw_url.split('|', 1)
        target_url = parts[0]
        params = urllib.parse.parse_qs(parts[1])
        for k, v in params.items():
            k_lower = k.lower()
            if 'user-agent' in k_lower:
                val = v[0]
                if 'referrer=' in val:
                    custom_headers['Referer'] = val.split('referrer=')[1]
                else:
                    custom_headers['User-Agent'] = val
            elif 'referer' in k_lower or 'referrer' in k_lower:
                custom_headers['Referer'] = v[0]
    return target_url, custom_headers

def parse_m3u_candidates():
    candidates = []
    try:
        req = urllib.request.Request(M3U_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as res:
            content = res.read().decode('utf-8', errors='ignore')
            
        lines = content.split('\n')
        current_info = None
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.startswith('#EXTINF:'):
                comma = line.rfind(',')
                name = line[comma+1:].strip() if comma != -1 else 'Unknown Channel'
                
                group_match = re.search(r'group-title="([^"]+)"', line, re.IGNORECASE)
                group = group_match.group(1) if group_match else 'General'
                
                logo_match = re.search(r'tvg-logo="([^"]+)"', line, re.IGNORECASE)
                logo = logo_match.group(1) if logo_match else None
                
                current_info = {
                    'name': name,
                    'group': group,
                    'logo': logo,
                    'url': ''
                }
            elif line.startswith('http') and current_info:
                current_info['url'] = line
                
                if 'dens.tv' in current_info['url']:
                    current_info['url'] = current_info['url'].replace('op-group1-swiftservehd-1.dens.tv', 'op-flashcon-digdayahd-1.dens.tv')
                
                url_clean = current_info['url'].split('|')[0]
                is_dash = url_clean.endswith('.mpd') or 'mpd' in url_clean
                
                # Perform fast static DRM validation (reject Widevine streams lacking decryption keys)
                is_allowed_dash = any(k in url_clean for k in ['cnnindonesia', 'cnbcindonesia']) or 'clearkey' in current_info['url'].lower() or 'license_key' in current_info['url'].lower() or 'license_url' in current_info['url'].lower()
                
                if is_dash and not is_allowed_dash:
                    current_info = None
                    continue
                
                name_lower = current_info['name'].lower()
                
                is_mnc_encrypted = any(k in name_lower for k in ['rcti', 'mnctv', 'gtv', 'global tv', 'inews'])
                if is_mnc_encrypted and not is_allowed_dash:
                    current_info = None
                    continue
                
                candidates.append(current_info)
                current_info = None
    except Exception as e:
        print("Parsing candidates error:", e)
        
    return candidates

def group_channels_into_categories(channels_list):
    apps_map = {
        'nasional': {
            'id': 'app-tv-nasional',
            'name': 'TV Nasional (FTA)',
            'icon': 'fa-solid fa-satellite-dish',
            'color': '#3b82f6',
            'channels': []
        },
        'movies_indo': {
            'id': 'app-movies-indo',
            'name': 'Film & Bioskop Indonesia',
            'icon': 'fa-solid fa-film',
            'color': '#ec4899',
            'channels': []
        },
        'bollywood': {
            'id': 'app-bollywood',
            'name': 'Bollywood & India TV',
            'icon': 'fa-solid fa-clapperboard',
            'color': '#eab308',
            'channels': []
        },
        'sports': {
            'id': 'app-sports-channels',
            'name': 'Sports & Olahraga',
            'icon': 'fa-solid fa-circle-play',
            'color': '#10b981',
            'channels': []
        },
        'international': {
            'id': 'app-int-fta',
            'name': 'World News & Intl',
            'icon': 'fa-solid fa-globe',
            'color': '#06b6d4',
            'channels': []
        }
    }

    for ch in channels_list:
        name_lower = ch['name'].lower()
        group_lower = ch['group'].lower()
        
        is_sports = any(k in name_lower or k in group_lower for k in ['sport', 'spotv', 'bein', 'bola', 'football', 'soccer'])
        is_intl = any(k in name_lower or k in group_lower for k in ['nhk', 'dw', 'france 24', 'al jazeera', 'news', 'bloomberg', 'cnbc', 'bbc', 'international', 'korea', 'china', 'vietnam'])
        
        is_movies_indo = any(k in name_lower or k in group_lower for k in ['citra bioskop', 'citra drama', 'citra entertainment', 'bioskop', 'layarkaca', 'filmin', 'jowo', 'fiksi', 'sinema indonesia'])
        
        is_bollywood = any(k in name_lower or k in group_lower for k in ['zee', 'bollywood', 'india', 'colors', 'sony', 'b4u', 'star gold', 'pictures', 'flix', 'jalwa', 'jhakaas', 'tashan', '9xm'])
        
        is_nasional = any(k in name_lower or k in group_lower for k in ['tvri', 'metro', 'sctv', 'indosiar', 'antv', 'daai', 'rtv', 'tvone', 'kompas', 'trans tv', 'trans7', 'transtv', 'trans 7']) or (group_lower in ['nasional', 'indonesia channels', 'local tv', 'general'])

        if is_movies_indo:
            apps_map['movies_indo']['channels'].append(ch)
        elif is_bollywood:
            apps_map['bollywood']['channels'].append(ch)
        elif is_sports:
            apps_map['sports']['channels'].append(ch)
        elif is_intl:
            apps_map['international']['channels'].append(ch)
        elif is_nasional:
            apps_map['nasional']['channels'].append(ch)
        else:
            apps_map['nasional']['channels'].append(ch)

    result = []
    for key in ['nasional', 'movies_indo', 'bollywood', 'sports', 'international']:
        if len(apps_map[key]['channels']) > 0:
            result.append(apps_map[key])
    return result

@app.route('/channels')
def channels():
    candidates = parse_m3u_candidates()
    categorized = group_channels_into_categories(candidates)
    return jsonify(categorized)

@app.route('/proxy')
def proxy():
    url = request.args.get('url')
    if not url:
        return "Missing URL", 400
        
    target_url, custom_headers = extract_headers_static(url)
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*'
        }
        if 'detik.com' in target_url:
            headers['Referer'] = 'https://www.detik.com/'
            headers['Origin'] = 'https://www.detik.com'
        elif 'trans7.co.id' in target_url:
            headers['Referer'] = 'https://www.trans7.co.id/'
        elif 'tvri.go.id' in target_url:
            headers['Referer'] = 'https://tvri.go.id/'
        elif 'dens.tv' in target_url:
            headers['Referer'] = 'https://www.dens.tv/'

        for k, v in custom_headers.items():
            headers[k] = v

        req = urllib.request.Request(target_url, headers=headers)
        with urllib.request.urlopen(req, timeout=8) as response:
            content = response.read()
            content_type = response.headers.get('Content-Type', 'application/octet-stream')
            
            is_hls = ('application/x-mpegurl' in content_type or 
                      'application/vnd.apple.mpegurl' in content_type or 
                      target_url.split('?')[0].endswith('.m3u8') or 
                      b'#EXTM3U' in content)
                      
            is_mpd = ('application/dash+xml' in content_type or 
                      target_url.split('?')[0].endswith('.mpd') or 
                      b'<MPD' in content)
            
            if is_hls:
                try:
                    decoded = content.decode('utf-8', errors='ignore')
                    base_url = target_url.split('?')[0].rsplit('/', 1)[0] + '/'
                    
                    pipe_suffix = ""
                    if '|' in url:
                        pipe_suffix = '|' + url.split('|', 1)[1]
                        
                    lines = decoded.split('\n')
                    new_lines = []
                    for line in lines:
                        line_stripped = line.strip()
                        if line_stripped and not line_stripped.startswith('#'):
                            if not line_stripped.startswith('http'):
                                if line_stripped.startswith('/'):
                                    host_match = re.match(r'(https?://[^/]+)', target_url)
                                    resolved_url = host_match.group(1) + line_stripped if host_match else base_url + line_stripped
                                else:
                                    resolved_url = base_url + line_stripped
                            else:
                                resolved_url = line_stripped
                            
                            final_url = resolved_url + pipe_suffix
                            host = request.headers.get('host', 'localhost:8080')
                            line = f"https://{host}/proxy?url={urllib.parse.quote_plus(final_url)}"
                        new_lines.append(line)
                    content = '\n'.join(new_lines).encode('utf-8')
                except Exception as e:
                    print("HLS rewrite error:", e)
            elif is_mpd:
                try:
                    decoded = content.decode('utf-8', errors='ignore')
                    base_url = target_url.split('?')[0].rsplit('/', 1)[0] + '/'
                    if '<BaseURL>' not in decoded:
                        mpd_match = re.search(r'(<MPD[^>]*>)', decoded, re.IGNORECASE)
                        if mpd_match:
                            opening_tag = mpd_match.group(1)
                            decoded = decoded.replace(opening_tag, f"{opening_tag}\n<BaseURL>{base_url}</BaseURL>", 1)
                            content = decoded.encode('utf-8')
                except Exception as e:
                    print("DASH BaseURL error:", e)
            
            return Response(content, mimetype=content_type)
    except Exception as e:
        return f"Proxy error: {e}", 500

@app.route('/')
def serve_index():
    return send_from_directory(ROOT_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(ROOT_DIR, path)

if __name__ == '__main__':
    app.run(port=8081)
