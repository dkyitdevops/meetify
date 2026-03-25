# GitHub Secrets Setup

## Необходимые секреты для CI/CD

Добавь следующие secrets в репозиторий:
https://github.com/dkyitdevops/ai-team-office/settings/secrets/actions

### 1. SERVER_HOST
- Name: `SERVER_HOST`
- Value: `46.149.68.9`

### 2. SERVER_USER
- Name: `SERVER_USER`
- Value: `root`

### 3. SSH_PRIVATE_KEY
- Name: `SSH_PRIVATE_KEY`
- Value:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACCGJQs19iZDRjeUsp4AZafPsbNqJAk8te5VcdnkWpVzCgAAAJgnRTMgJ0Uz
IAAAAAtzc2gtZWQyNTUxOQAAACCGJQs19iZDRjeUsp4AZafPsbNqJAk8te5VcdnkWpVzCg
AAAEA0W6em4rrQzlOeIDNEOmlHCsWErPdPlBh7+gGbP35XSYYlCzX2JkNGN5SyngBlp8+x
s2okCTy17lVx2eRalXMKAAAAEGtpbWktY2xhdy1kZXBsb3kBAgMEBQ==
-----END OPENSSH PRIVATE KEY-----
```

### 4. DEPLOY_DIR (опционально)
- Name: `DEPLOY_DIR`
- Value: `/opt/ai-team-office`

## После добавления секретов

Запусти workflow вручную:
https://github.com/dkyitdevops/ai-team-office/actions/workflows/deploy.yml

Или сделай push в main ветку — деплой запустится автоматически.
