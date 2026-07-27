# C-Flow Monitoring Dashboard

 

## Obiettivo

 

Realizzare una applicazione web per il monitoraggio dello stato dei server appartenenti alla farm C-Flow.

 

L'applicazione deve essere composta da:

 

- Backend sviluppato in Python

- Frontend sviluppato in Angular

- Database PostgreSQL

- Contenitori Docker per deployment

 

L'obiettivo è verificare periodicamente la raggiungibilità di una serie di endpoint HTTP e visualizzarne lo stato tramite una dashboard web moderna.

 

---

 

# Architettura

 

## Frontend

 

Tecnologie:

 

- Angular (ultima versione stabile)

- Angular Material

- RxJS

- SCSS

 

## Backend

 

Tecnologie:

 

- Python 3.12

- FastAPI

- SQLAlchemy

- APScheduler

- httpx

 

## Database

 

- PostgreSQL

 

## Deployment

 

- Docker

- Docker Compose

- Nginx come reverse proxy

 

---

 

# Requisiti Funzionali

 

## Monitoraggio Endpoint

 

Ogni server monitorato è rappresentato da:

 

```json

{

"id": 1,

"name": "CFLOW01",

"url": "http://xx.xx.xx.xx:8888/probe/",

"username": "monitor",

"password": "password",

"enabled": true,

"warningThresholdMs": 1000,

"criticalThresholdMs": 3000

}

```

 

Per ogni endpoint:

 

- effettuare una chiamata HTTP GET

- utilizzare autenticazione Basic Authentication

- verificare che il Response Code sia 200

 

---

 

## Pianificazione Controlli

 

Il sistema deve eseguire automaticamente il controllo di tutti gli endpoint.

 

Configurazione:

 

```text

Default: ogni 60 secondi

```

 

Il valore deve essere configurabile.

 

Utilizzare APScheduler.

 

---

 

## Informazioni da memorizzare

 

Ad ogni controllo registrare:

 

- Endpoint verificato

- Timestamp

- HTTP Status Code

- Response Time (ms)

- Stato logico

 

Stati possibili:

 

```text

UP

WARNING

DOWN

```

 

Regole:

 

```text

UP

- RC = 200

- tempo risposta < warningThreshold

 

WARNING

- RC = 200

- tempo risposta >= warningThreshold

 

DOWN

- timeout

- errore rete

- RC diverso da 200

```

 

---

 

# Dashboard

 

La dashboard deve essere responsive e moderna.

 

Tema:

 

- Material Design

- colori aziendali blu/grigio

- dark mode opzionale

 

---

 

## Cruscotto Principale

 

Visualizzare:

 

### Tile riepilogative

 

- Totale server

- Server UP

- Server WARNING

- Server DOWN

 

Esempio:

 

```text

+-----------+

| Totale 12 |

+-----------+

 

+-----------+

| UP 10 |

+-----------+

 

+-----------+

| WARN 1 |

+-----------+

 

+-----------+

| DOWN 1 |

+-----------+

```

 

---

 

## Tabella Monitoraggio

 

Visualizzare:

 

| Campo |

|---------|

| Nome server |

| URL |

| Stato |

| HTTP Code |

| Response Time |

| Ultimo Check |

| Link |

 

Funzionalità:

 

- ordinamento colonne

- filtro ricerca

- paginazione

- refresh automatico

 

Colori:

 

```text

UP -> Verde

WARNING -> Arancione

DOWN -> Rosso

```

 

---

 

## Grafico Performance

 

Visualizzare:

 

- andamento tempi di risposta ultime 24 ore

- selezione server

 

Utilizzare:

 

```text

Chart.js

```

 

---

 

## Storico

 

Pagina dedicata:

 

```text

/servers/:id/history

```

 

Visualizzare:

 

- data controllo

- response code

- response time

- stato

 

Con paginazione.

 

---

 

# Gestione Endpoint

 

Creare una sezione amministrativa.

 

Pagina:

 

```text

/settings/servers

```

 

Funzionalità:

 

- inserimento endpoint

- modifica endpoint

- eliminazione endpoint

- attivazione/disattivazione monitoraggio

 

Campi:

 

```text

Nome

URL

Username

Password

Warning Threshold

Critical Threshold

Enabled

```

 

---

 

# Sicurezza

 

## Password

 

Le password NON devono essere memorizzate in chiaro.

 

Utilizzare:

 

```python

cryptography.fernet

```

 

oppure equivalente.

 

---

 

## API

 

Proteggere le API mediante:

 

```text

JWT Authentication

```

 

Ruoli:

 

```text

ADMIN

VIEWER

```

 

Permessi:

 

ADMIN

 

- gestione endpoint

- accesso dashboard

 

VIEWER

 

- sola consultazione dashboard

 

---

 

# Database

 

## Tabella monitored_servers

 

```sql

CREATE TABLE monitored_servers

(

id SERIAL PRIMARY KEY,

name VARCHAR(100) NOT NULL,

url VARCHAR(500) NOT NULL,

username VARCHAR(100),

password_encrypted TEXT,

enabled BOOLEAN DEFAULT TRUE,

warning_threshold INTEGER DEFAULT 1000,

critical_threshold INTEGER DEFAULT 3000,

created_at TIMESTAMP,

updated_at TIMESTAMP

);

```

 

---

 

## Tabella monitoring_history

 

```sql

CREATE TABLE monitoring_history

(

id BIGSERIAL PRIMARY KEY,

server_id INTEGER NOT NULL,

check_time TIMESTAMP NOT NULL,

http_code INTEGER,

response_time_ms INTEGER,

status VARCHAR(20),

error_message TEXT

);

```

 

---

 

## Tabella users

 

```sql

CREATE TABLE users

(

id SERIAL PRIMARY KEY,

username VARCHAR(100),

password_hash TEXT,

role VARCHAR(20)

);

```

 

---

 

# API REST

 

## Authentication

 

### Login

 

```http

POST /api/auth/login

```

 

Response:

 

```json

{

"access_token": "jwt-token"

}

```

 

---

 

# Servers

 

## Elenco

 

```http

GET /api/servers

```

 

---

 

## Dettaglio

 

```http

GET /api/servers/{id}

```

 

---

 

## Creazione

 

```http

POST /api/servers

```

 

---

 

## Modifica

 

```http

PUT /api/servers/{id}

```

 

---

 

## Cancellazione

 

```http

DELETE /api/servers/{id}

```

 

---

 

# Monitoring

 

## Stato Corrente

 

```http

GET /api/monitoring/status

```

 

Response:

 

```json

[

{

"id": 1,

"name": "CFLOW01",

"status": "UP",

"httpCode": 200,

"responseTimeMs": 53,

"lastCheck": "2026-07-23T12:00:01"

}

]

```

 

---

 

## Storico

 

```http

GET /api/monitoring/history/{serverId}

```

 

---

 

# Backend Design

 

Struttura progetto:

 

```text

backend/

│

├── app/

│ ├── api/

│ ├── core/

│ ├── db/

│ ├── models/

│ ├── repositories/

│ ├── services/

│ ├── scheduler/

│ ├── security/

│ └── main.py

│

├── tests/

│

├── requirements.txt

│

└── Dockerfile

```

 

---

 

# Frontend Design

 

Struttura progetto:

 

```text

frontend/

│

├── src/app/

│

├── core/

│ ├── guards/

│ ├── interceptors/

│ └── services/

│

├── shared/

│

├── pages/

│ ├── login/

│ ├── dashboard/

│ ├── servers/

│ └── history/

│

└── app.routes.ts

```

 

---

 

# Requisiti UI

 

La dashboard deve essere comparabile a:

 

- Grafana

- PRTG

- Zabbix

 

Caratteristiche:

 

- Design pulito

- Responsive

- Material Design

- Effetti hover

- Badge colorati

- Grafici interattivi

- Auto refresh ogni 60 secondi

 

---

 

# Requisiti Non Funzionali

 

- Logging centralizzato

- Gestione errori robusta

- Test unitari backend

- Test unitari frontend

- Dockerizzazione completa

- Configurazione tramite variabili ambiente

- Supporto HTTPS tramite Nginx

 

---

 

# Deliverable Attesi

 

Generare l'intero progetto con:

 

1. Backend FastAPI completo

2. Frontend Angular completo

3. Database PostgreSQL

4. Dockerfile backend

5. Dockerfile frontend

6. Docker Compose

7. Script di inizializzazione database

8. README di installazione

9. Test unitari principali

10. File .env.example

 

Il codice deve essere production-ready, modulare, manutenibile e conforme alle best practice Angular e FastAPI.
