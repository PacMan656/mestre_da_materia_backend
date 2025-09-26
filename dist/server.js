"use strict";
// 1. IMPORTAÇÕES
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
// 2. APP / CONFIG
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
// 3. PRISMA (Postgres)
const prisma = new PrismaClient();
(async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log('✅ Conectado ao PostgreSQL com Prisma!');
    }
    catch (err) {
        console.error('❌ Erro ao conectar no PostgreSQL:', err);
    }
})();
// 4. HELPERS
function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}
// Middleware para rotas protegidas
function auth(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : null;
        if (!token)
            return res.status(401).json({ message: 'Token não fornecido.' });
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, email, name }
        next();
    }
    catch (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
}
// 5. ROTAS
// Registro: cria usuário no Postgres com senha hasheada
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Por favor, preencha name, email e password.' });
        }
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, passwordHash },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        const token = signToken({ id: user.id, email: user.email, name: user.name });
        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            token,
            user,
        });
    }
    catch (err) {
        console.error('Erro no /api/register:', err);
        res.status(500).json({ message: 'Erro no servidor ao registrar usuário.' });
    }
});
// Login: valida senha e retorna JWT
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, informe email e password.' });
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        const token = signToken({ id: user.id, email: user.email, name: user.name });
        res.json({
            message: 'Login realizado com sucesso!',
            token,
            user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
        });
    }
    catch (err) {
        console.error('Erro no /api/login:', err);
        res.status(500).json({ message: 'Erro no servidor ao fazer login.' });
    }
});
// Rota protegida: dados do usuário autenticado
app.get('/api/me', auth, async (req, res) => {
    try {
        const me = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, createdAt: true },
        });
        if (!me)
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        res.json(me);
    }
    catch (err) {
        console.error('Erro no /api/me:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});
// 6. INICIA (local)
// (Na Vercel, normalmente você usaria API Routes. Se mantiver este servidor,
// a Vercel ignora o listen e usa a exportação do app.)
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
// 7. ENCERRAMENTO LIMPO
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
// 8. EXPORT PARA VERCEL
module.exports = app;
