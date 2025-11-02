# 🚨 SECURITY INCIDENT RESPONSE - Data Exposure Cleanup

**Data:** 2 de novembro de 2025  
**Severidade:** 🔴 **CRÍTICA**  
**Status:** 🔄 **EM REMEDIAÇÃO**

---

## ⚠️ Problema Identificado

Foram encontrados **dados sensíveis expostos** no histórico do repositório Git:

### Arquivos Comprometidos
```
supabase/backups/backup-20251031-004300.sql (147KB)
supabase/backups/backup-20251102-122426.sql (149KB)
supabase/backups/backup-20251102-125008.sql (149KB)
supabase/backups/backup-20251102-133503.sql (149KB)
backups/pre-i18n-20251031-010740.sql
+ 5 arquivos vazios de tentativas
```

### Dados em Risco
- ✅ **Schema de banco (estrutura)** - Baixo risco
- 🔴 **User emails e dados de perfil** - Alto risco (PII)
- 🔴 **Tokens de sessão e autenticação** - Crítico
- 🔴 **Credenciais no DATABASE_URL** - Crítico
- ⚠️ **Conteúdo de produtos e reviews** - Médio risco

---

## 📋 Plano de Ação Imediata

### Fase 1: Prevenção Futura ✅
- [x] Atualizar `.gitignore` com regras robustas
- [x] Adicionar exceções para migrations do Prisma
- [x] Documentar políticas de segurança

### Fase 2: Remoção do Histórico (REQUER AÇÃO MANUAL)
⚠️ **ATENÇÃO:** Esta etapa reescreve o histórico do Git e DEVE ser feita com cuidado!

```bash
# 1. BACKUP COMPLETO (CRÍTICO!)
cd /Users/bblb/Desktop/AgoraRecomendo
cp -r agorarecomendo agorarecomendo-BACKUP-$(date +%Y%m%d-%H%M%S)

# 2. Instalar git-filter-repo
pip3 install git-filter-repo

# 3. Entrar no repositório
cd agorarecomendo

# 4. REMOVER BACKUPS SQL DO HISTÓRICO
git filter-repo --path supabase/backups/ --invert-paths --force
git filter-repo --path backups/pre-i18n-20251031-010740.sql --invert-paths --force

# 5. Force push (SOBRESCREVE O REMOTO!)
git remote add origin https://github.com/bkdsb/agorarecomendo.git
git push origin --force --all
git push origin --force --tags
```

### Fase 3: Rotação de Credenciais 🔴 **URGENTE**
Após remover do histórico, você DEVE trocar:

1. **Database Password (Supabase)**
   - Acessar: https://supabase.com/dashboard/project/[seu-projeto]/settings/database
   - Clicar em "Reset database password"
   - Atualizar `.env` local com nova senha
   - Atualizar variáveis no Vercel/deploy

2. **NextAuth Secret**
   ```bash
   # Gerar novo secret
   openssl rand -base64 32
   ```
   - Atualizar `NEXTAUTH_SECRET` no `.env` e Vercel

3. **Google OAuth Credentials** (se vazaram)
   - Revogar credenciais antigas no Google Cloud Console
   - Criar novas OAuth 2.0 credentials
   - Atualizar `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`

4. **Invalidar Sessões de Usuários**
   ```sql
   -- Execute no Supabase SQL Editor
   DELETE FROM "Session";
   DELETE FROM "VerificationToken";
   ```

---

## 🔒 Políticas de Segurança Implementadas

### .gitignore Atualizado
```gitignore
# Database backups (PII, credentials)
supabase/backups/
backups/*.sql
*.sql
!prisma/migrations/**/*.sql  # Exception for migrations

# Environment files
.env*

# Logs
*.log
logs/
```

### Boas Práticas
1. **Backups devem ser:**
   - Armazenados fora do repositório Git
   - Encriptados em repouso
   - Com acesso restrito (S3 privado, servidor seguro)

2. **Nunca commitar:**
   - Arquivos `.env` (exceto `.env.example` sem valores reais)
   - Dumps de banco de dados
   - Logs de aplicação
   - Arquivos de configuração com credenciais

3. **Usar variáveis de ambiente:**
   - Produção: Vercel/plataforma de deploy
   - Desenvolvimento: `.env.local` (gitignored)

---

## 📊 Checklist de Verificação

### Antes do Force Push
- [ ] Backup completo do repositório criado
- [ ] git-filter-repo instalado e testado
- [ ] Equipe notificada sobre a reescrita do histórico
- [ ] CI/CD pipelines pausados (se aplicável)

### Após Force Push
- [ ] Todas as credenciais rotacionadas
- [ ] Sessões de usuários invalidadas
- [ ] `.env` atualizado com novos valores
- [ ] Deploy com novas variáveis
- [ ] Verificar logs por acessos suspeitos

### Validação Final
- [ ] `git log --all -- supabase/backups/` não retorna nada
- [ ] `git log --all -- '*.sql'` só mostra migrations do Prisma
- [ ] Build e deploy funcionando com novas credenciais
- [ ] Monitorar por 48h por atividades suspeitas

---

## 🔍 Como Verificar Se Foi Removido

```bash
# Verificar que backups não existem no histórico
git log --all --oneline -- supabase/backups/
# Deve retornar vazio

# Verificar arquivos SQL rastreados
git ls-files | grep '\.sql$'
# Deve retornar APENAS migrations do Prisma

# Verificar tamanho do repositório (deve diminuir)
du -sh .git/
```

---

## 📞 Próximos Passos

### Imediato (Próximas 2 horas)
1. ✅ Criar backup local completo
2. ⏳ Executar `git filter-repo` para limpar histórico
3. ⏳ Force push para remoto
4. ⏳ Rotacionar TODAS as credenciais

### Curto Prazo (24 horas)
1. ⏳ Monitorar logs de acesso ao banco
2. ⏳ Verificar atividades suspeitas em contas
3. ⏳ Implementar 2FA em contas críticas

### Médio Prazo (1 semana)
1. ⏳ Revisar políticas de backup
2. ⏳ Implementar backup automatizado seguro (fora do Git)
3. ⏳ Adicionar pre-commit hooks para prevenir commits acidentais
4. ⏳ Documentar processo de resposta a incidentes

---

## 🛡️ Prevenção Futura

### Pre-commit Hook Recomendado
```bash
# .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | grep -E '\.(env|sql)$|backups/'; then
    echo "❌ ERRO: Tentativa de commit de arquivo sensível detectada!"
    echo "Arquivos bloqueados:"
    git diff --cached --name-only | grep -E '\.(env|sql)$|backups/'
    exit 1
fi
```

### Git Secrets Tool
```bash
# Instalar git-secrets
brew install git-secrets  # macOS

# Configurar no repositório
git secrets --install
git secrets --register-aws
git secrets --add 'DATABASE_URL.*'
git secrets --add 'NEXTAUTH_SECRET.*'
```

---

## 📚 Referências
- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-filter-repo documentation](https://github.com/newren/git-filter-repo)
- [OWASP: Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**⚠️ IMPORTANTE:** Este documento contém instruções DESTRUTIVAS. Leia completamente antes de executar qualquer comando.

**Status:** Aguardando execução manual das etapas de limpeza do histórico.
