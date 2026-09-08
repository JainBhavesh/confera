FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Persisted as a volume in docker-compose.yml so the downloaded Whisper
# model survives container restarts/rebuilds instead of re-downloading.
ENV HF_HOME=/models

EXPOSE 8100

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8100"]
