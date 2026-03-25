# Figma MCP Server — Инструкция по настройке

## Быстрый старт

### 1. Создать Figma аккаунт
- Перейти на https://figma.com
- Зарегистрироваться (бесплатный план подходит для тестов)

### 2. Получить Personal Access Token
1. Открыть Settings: https://figma.com/settings
2. В разделе "Personal Access Tokens" нажать "Create new token"
3. Дать название: "OpenClaw MCP"
4. Выбрать scopes:
   - ✅ `file_read` — чтение файлов
   - ✅ `file_write` — запись в файлы
   - ✅ `file_dev_resources` — Code Connect
5. Скопировать токен (показывается только один раз!)

### 3. Сохранить токен

```bash
# Создать файл с токеном
mkdir -p /data/workspace/credentials
echo "FIGMA_TOKEN=YOUR_TOKEN_HERE" > /data/workspace/credentials/figma.env
chmod 600 /data/workspace/credentials/figma.env
```

### 4. Настроить MCP Server в OpenClaw

Добавить в конфигурацию MCP:
```json
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://mcp.figma.com/mcp",
      "headers": {
        "Authorization": "Bearer ${FIGMA_TOKEN}"
      }
    }
  }
}
```

---

## Тестовые команды

После настройки можно использовать:

### Создать файл
```
Создай новый Figma файл "Test Design"
```

### Создать кнопку
```
В файле [URL] создай кнопку:
- Размер: 120x44px
- Фон: #00ff88
- Border radius: 8px
- Текст: "Click me"
```

### Создать карточку
```
Создай карточку:
- Размер: 300x200px
- Фон: белый
- Тень: 0 4px 12px rgba(0,0,0,0.1)
- Внутри: заголовок, текст, кнопка
```

### Получить код
```
По ссылке [Figma URL] сгенерируй React компонент
```

---

## Ограничения

| План | Ограничения |
|------|-------------|
| Starter | 6 tool calls/month |
| Professional | Rate limits per minute (Tier 1 API) |
| Organization/Enterprise | Rate limits per minute (Tier 1 API) |

**Важно:** Write-to-canvas требует Full или Dev seat на paid плане.

---

## Полезные ссылки

- Документация: https://developers.figma.com/docs/figma-mcp-server/
- GitHub: https://github.com/figma/mcp-server-guide
- Список skills: https://help.figma.com/hc/en-us/articles/39166810751895
