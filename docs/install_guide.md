# 🚀 Guida all'Installazione - MirrorMe

## Passaggi di Installazione

### 1. Preparazione
1. Apri il file `create_icons.html` nel browser
2. Scarica tutte e tre le icone (16x16, 48x48, 128x128)
3. Salva le icone nella cartella `icons/` del progetto

### 2. Installazione in Chrome
1. Apri Google Chrome
2. Vai su `chrome://extensions/`
3. Attiva la "Modalità sviluppatore" (toggle in alto a destra)
4. Clicca "Carica estensione non pacchettizzata"
5. Seleziona la cartella MirrorMe
6. L'estensione dovrebbe apparire nella lista

### 3. Configurazione API
1. Vai su [Google AI Studio](https://aistudio.google.com/)
2. Crea un nuovo progetto o usa uno esistente
3. Genera una API Key per Gemini
4. Clicca sull'icona MirrorMe in Chrome
5. Inserisci la API Key nel popup
6. Carica una tua foto

### 4. Test dell'Estensione
1. Vai su un sito con immagini (es. unsplash.com)
2. Passa il mouse sopra un'immagine
3. Dovrebbe apparire il badge MirrorMe
4. Clicca sul badge per testare la generazione

## 🔧 Debugging

### Console Browser
- Apri DevTools (F12)
- Controlla la tab Console per errori
- Verifica che il content script sia caricato

### Estensione
- Vai su `chrome://extensions/`
- Clicca "Dettagli" su MirrorMe
- Controlla "Ispeziona visualizzazioni" per il service worker

### API Testing
```javascript
// Test API key in console
fetch('https://generativelanguage.googleapis.com/v1beta/models', {
  headers: { 'x-goog-api-key': 'YOUR_API_KEY' }
}).then(r => console.log(r.status));
```

## 📝 Checklist Pre-Rilascio

- [ ] Icone create e posizionate
- [ ] API Key configurata e testata
- [ ] Content script funzionante su vari siti
- [ ] Badge hover responsive
- [ ] Generazione immagini funzionante
- [ ] Modal risultati visualizzato correttamente
- [ ] Download immagini funzionante
- [ ] Gestione errori implementata

## 🌐 Siti di Test Consigliati

- **Fashion**: zara.com, hm.com
- **Auto**: ferrari.com, tesla.com  
- **Food**: foodnetwork.com
- **Travel**: booking.com, airbnb.com
- **General**: unsplash.com, pexels.com

## ⚠️ Problemi Comuni

### Badge non appare
- Ricarica la pagina
- Controlla che l'immagine sia > 100x100px
- Verifica CORS policy del sito

### API Error 403
- Verifica API Key
- Controlla quota API su Google Cloud Console
- Assicurati che Gemini API sia abilitata

### Immagine non si genera
- Controlla dimensioni immagine utente (max 4MB)
- Verifica formato supportato (PNG, JPG)
- Controlla connessione internet

## 📊 Metriche di Successo

- Badge appare su 90%+ delle immagini valide
- Generazione immagini < 10 secondi
- Tasso di successo API > 95%
- Zero crash dell'estensione
