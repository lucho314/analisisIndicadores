import time
import requests
from datetime import datetime, timezone

# Configuración

def get_indicadores():
    base = 'https://api.twelvedata.com'
    endpoints = {
        'rsi': f'{base}/rsi?symbol={SYMBOL}&interval={INTERVAL}&apikey={API_KEY}',
        'macd': f'{base}/macd?symbol={SYMBOL}&interval={INTERVAL}&apikey={API_KEY}',
        'sma': f'{base}/sma?symbol={SYMBOL}&interval={INTERVAL}&apikey={API_KEY}',
        'adx': f'{base}/adx?symbol={SYMBOL}&interval={INTERVAL}&apikey={API_KEY}',
        'bbands': f'{base}/bbands?symbol={SYMBOL}&interval={INTERVAL}&apikey={API_KEY}'
    }
    data = {}
    for idx, (key, url) in enumerate(endpoints.items()):
        print(f"Solicitando indicador: {key.upper()} ({idx+1}/{len(endpoints)})...")
        try:
            resp = requests.get(url)
            data[key] = resp.json()
            print(f"Respuesta {key.upper()}: {data[key]}")
        except Exception as e:
            print(f"Error al solicitar {key.upper()}: {e}")
            data[key] = None
        if idx < len(endpoints) - 1:
            print("Esperando 1 segundos para la próxima petición...")
            time.sleep(1)
    print("Todos los indicadores han sido solicitados.\n")
    return data

def analizar(indicadores):
    alertas = []

    print("Indicadores obtenidos:", indicadores)

    # RSI
    rsi_data = indicadores['rsi'].get('values')
    rsi = float(rsi_data[0]['rsi']) if rsi_data and 'rsi' in rsi_data[0] else None
    if rsi is not None:
        if rsi < 35:
            alertas.append(f"RSI bajo ({rsi:.2f}): posible sobreventa.")
        elif rsi > 70:
            alertas.append(f"RSI alto ({rsi:.2f}): posible sobrecompra.")

    # MACD
    macd_data = indicadores['macd'].get('values')
    macd_hist = float(macd_data[0]['histogram']) if macd_data and 'histogram' in macd_data[0] else None
    if macd_hist is not None:
        if macd_hist > 0:
            alertas.append(f"MACD histograma positivo ({macd_hist:.2f}): posible señal alcista.")
        elif macd_hist < 0:
            alertas.append(f"MACD histograma negativo ({macd_hist:.2f}): posible señal bajista.")

    # SMA
    sma_data = indicadores['sma'].get('values')
    sma = float(sma_data[0]['sma']) if sma_data and 'sma' in sma_data[0] else None
    close = float(sma_data[0]['close']) if sma_data and 'close' in sma_data[0] else None
    if sma is not None and close is not None:
        if close > sma:
            alertas.append(f"Precio ({close:.2f}) por encima de SMA9 ({sma:.2f}): tendencia alcista.")
        elif close < sma:
            alertas.append(f"Precio ({close:.2f}) por debajo de SMA9 ({sma:.2f}): tendencia bajista.")

    # ADX
    adx_data = indicadores['adx'].get('values')
    adx = float(adx_data[0]['adx']) if adx_data and 'adx' in adx_data[0] else None
    if adx is not None:
        if adx > 25:
            alertas.append(f"ADX alto ({adx:.2f}): tendencia fuerte.")
        else:
            alertas.append(f"ADX bajo ({adx:.2f}): tendencia débil o lateral.")

    # Bandas de Bollinger
    bbands_data = indicadores['bbands'].get('values')
    if bbands_data:
        close = float(bbands_data[0]['close']) if 'close' in bbands_data[0] else None
        upper = float(bbands_data[0]['upper_band']) if 'upper_band' in bbands_data[0] else None
        lower = float(bbands_data[0]['lower_band']) if 'lower_band' in bbands_data[0] else None
        if close is not None and upper is not None and lower is not None:
            if close >= upper:
                alertas.append(f"Precio ({close:.2f}) tocó la banda superior de Bollinger ({upper:.2f}): posible sobrecompra.")
            elif close <= lower:
                alertas.append(f"Precio ({close:.2f}) tocó la banda inferior de Bollinger ({lower:.2f}): posible sobreventa.")

    return alertas

def enviar_alerta_brevo(asunto, mensaje):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
    }
    data = {
        "sender": {"name": "Alerta BTC", "email": EMAIL_FROM},
        "to": [{"email": EMAIL_TO}],
        "subject": asunto,
        "htmlContent": f"<html><body><p>{mensaje}</p></body></html>"
    }
    resp = requests.post(url, json=data, headers=headers)
    return resp.status_code == 201 or resp.status_code == 202

def enviar_whatsapp_callmebot(numero, apikey, mensaje):
    url = f"https://api.callmebot.com/whatsapp.php?phone={numero}&text={mensaje}&apikey={apikey}"
    try:
        resp = requests.get(url)
        print(f"WhatsApp status: {resp.status_code}, respuesta: {resp.text}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error enviando WhatsApp: {e}")
        return False

if __name__ == "__main__":
    # Solo ejecuta si la hora es múltiplo de 4 (UTC)
    hora_actual = datetime.now(timezone.utc).hour
    print(f"Hora actual (UTC): {hora_actual}")
    if hora_actual % 4 != 0:
        print("No es apertura de vela de 4h. Saliendo...")
        exit()

    indicadores = get_indicadores()
    alertas = analizar(indicadores)
    if alertas:
        mensaje = "<br>".join(alertas)
        asunto = "Alerta técnica BTC/USD"
        # if enviar_alerta_brevo(asunto, mensaje):
        #     print("¡Alerta enviada por correo!")
        # else:
        #     print("Error al enviar la alerta.")
        # Enviar WhatsApp
        NUMERO_WSP = '5493434697053'
        APIKEY_WSP = '8494152'
        mensaje_wsp = asunto + " - " + " | ".join(alertas)
        enviar_whatsapp_callmebot(NUMERO_WSP, APIKEY_WSP, mensaje_wsp)
    else:
        print("Sin alertas técnicas en este momento.")