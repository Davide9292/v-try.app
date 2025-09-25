# MirrorMe Chrome Extension

Chrome extension per virtual try-on con AI, parte della piattaforma V-Try.app.

## 🚀 Installazione Rapida

1. Clona la repository principale:
```bash
git clone https://github.com/davidepedone/v-try.app.git
cd v-try.app/extension/
```

2. Carica l'estensione in Chrome:
   - Apri Chrome e vai su `chrome://extensions/`
   - Attiva "Modalità sviluppatore"
   - Clicca "Carica estensione non pacchettizzata"
   - Seleziona la cartella `extension/`

3. Configura l'estensione:
   - Clicca sull'icona MirrorMe
   - Inserisci la tua [Gemini API Key](https://ai.google.dev/gemini-api/docs/api-key)
   - Carica la tua foto

## 📁 Struttura File

```
extension/
├── manifest.json       # Configurazione estensione
├── popup.html         # Interfaccia popup
├── popup.css          # Stili popup
├── popup.js           # Logica popup
├── content.js         # Script per pagine web
├── content.css        # Stili per badge e modal
├── background.js      # Service worker
├── icons/            # Icone estensione
├── test_page.html    # Pagina di test
└── create_icons.html # Generatore icone
```

## 🎯 Come Funziona

1. **Hover Detection**: Rileva quando passi il mouse su un'immagine
2. **Badge Display**: Mostra il badge MirrorMe
3. **AI Processing**: Invia immagini a Gemini AI
4. **Result Display**: Mostra il risultato in un modal elegante

## 🔧 Configurazione Sviluppatore

### Prerequisiti
- Chrome 88+
- Gemini API Key

### Debug
```bash
# Console extension
chrome://extensions/ > MirrorMe > Dettagli > Ispeziona visualizzazioni

# Console content script
F12 > Console (su qualsiasi pagina web)
```

### Test
Apri `test_page.html` per testare tutte le funzionalità.

## 🌐 Integrazione Website

Questa estensione è parte della piattaforma V-Try.app. Il website principale fornisce:
- Account management
- Cronologia try-on
- Funzionalità avanzate
- Download estensione

## 📊 Metriche

L'estensione traccia (localmente):
- Try-on completati
- Errori API
- Performance metrics

## 🔒 Privacy

- Nessun tracking esterno
- Dati salvati solo localmente
- API calls solo a Google Gemini
- Nessuna raccolta dati personali

## 📝 Limitazioni

- Rate limits API Gemini
- Immagini max 4MB
- CORS restrictions su alcuni siti
- Solo immagini statiche (video in arrivo)

## 🆘 Supporto

- [Documentazione completa](../docs/)
- [Issues GitHub](https://github.com/davidepedone/v-try.app/issues)
- [Website V-Try.app](https://v-try.app) (quando disponibile)
