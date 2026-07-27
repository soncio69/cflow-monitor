# C-Flow Monitoring Dashboard

Applicazione web per il monitoraggio dello stato dei server C-Flow.

## Architettura

- **Backend**: FastAPI (Python 3.12)
- **Frontend**: Angular 17 + Angular Material
- **Database**: PostgreSQL 16
- **Container**: Docker + Docker Compose

## Prerequisiti

- Docker
- Docker Compose

## Installazione

1. Clona il repository o estrai il progetto

2. Avvia i container:

```bash
docker-compose up -d
```

3. Accedi all'applicazione:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8000

## Credenziali Default

- Username: `admin`
- Password: `admin`

## Configurazione

### Backend

Le variabili di ambiente (già configurate in docker-compose.yml):

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| DATABASE_URL | postgresql://cflow:cflow@postgres:5432/cflow_monitor | Connection string DB |
| CHECK_INTERVAL_SECONDS | 60 | Intervallo check in secondi |

Per modificare, editare `docker-compose.yml` o creare un file `.env`.

## Utilizzo

### Aggiungere Server Monitorati

1. Accedi al pannello di amministrazione
2. Vai su "Server" nel menu laterale
3. Clicca "Aggiungi Server"
4. Inserisci i dettagli:
   - Nome identificativo
   - URL endpoint (es. http://xx.xx.xx.xx:8888/probe/)
   - Username e password (se richiesti)
   - Soglie warning/critical (in ms)

### Dashboard

La dashboard mostra:
- **Tile riepilogativi**: Totale, UP, WARNING, DOWN
- **Tabella server**: Stato in tempo reale con ordinamento e filtro
- **Grafico**: Andamento response time ultime 24 ore

### Storico

Clicca sull'icona "history" accanto a ogni server per vedere lo storico completo.

## API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/servers | Lista server |
| POST | /api/servers | Crea server |
| PUT | /api/servers/{id} | Aggiorna server |
| DELETE | /api/servers/{id} | Elimina server |
| GET | /api/monitoring/status | Stato attuale |
| GET | /api/monitoring/history/{id} | Storico server |
| GET | /api/monitoring/chart/{id} | Dati grafico |
| POST | /api/monitoring/check-now | Trigger check manuale |

## Sviluppo

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Monitoraggio

Il sistema esegue automaticamente il check di tutti i server abilitati ogni 60 secondi (configurabile).

### Stati

- **UP**: HTTP 200 e response time < soglia warning
- **WARNING**: HTTP 200 e response time >= soglia warning
- **DOWN**: Timeout, errore di rete o HTTP != 200
