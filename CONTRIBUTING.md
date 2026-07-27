# Contributing to C-Flow Monitor

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## Running Tests

### Backend
```bash
cd backend
TESTING=1 pytest tests/ -v
```

### Frontend
```bash
cd frontend
npm test
```

## Code Style

- Python: Follow PEP 8
- TypeScript: Follow Angular style guide
- Use meaningful variable names
- Add comments for complex logic

## Submitting Changes

1. Ensure all tests pass
2. Update documentation if needed
3. Commit with clear messages
4. Push to your fork
5. Create a pull request
