"use strict";
// 1. IMPORTAÇÕES DAS BIBLIOTECAS
const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config(); // Carrega variáveis de ambiente do .env
// 2. CONFIGURAÇÕES INICIAIS
const app = express();
const PORT = process.env.PORT || 3001; // Define a porta
app.use(express.json());
// Configuração do CORS para permitir o frontend
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
app.use(cors(corsOptions));
// Chave secreta para o JWT
const JWT_SECRET = process.env.JWT_SECRET;
// 3. INICIALIZAÇÃO DO FIREBASE ADMIN
// =================== AJUSTE PRINCIPAL AQUI ===================
// Monta o objeto de credencial a partir das variáveis de ambiente separadas
try {
    // Garantir que a chave privada exista e tenha o tipo correto antes de usar .replace
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!rawPrivateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY não está definida nas variáveis de ambiente.');
    }
    const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        // A linha abaixo é CRUCIAL para formatar a chave privada corretamente
        private_key: rawPrivateKey.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };
    // Verifica se o app já foi inicializado (importante para ambientes serverless)
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK inicializado com sucesso!');
    }
}
catch (error) {
    console.error('ERRO FATAL ao inicializar Firebase Admin SDK. Verifique suas variáveis de ambiente.', error);
}
// =================== FIM DO AJUSTE ===================
const db = admin.firestore(); // Instância do Firestore
// 4. ROTA DE CADASTRO DE USUÁRIO COM FIREBASE
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }
        // a. Cria o usuário no Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: name,
        });
        // b. Salva informações adicionais no Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name: name,
            email: email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // c. Gera um Token JWT
        const token = jwt.sign({ id: userRecord.uid, name: name }, JWT_SECRET, {
            expiresIn: '1h',
        });
        // d. Envia a resposta de sucesso
        res.status(201).json({
            message: 'Usuário criado com sucesso!',
            token: token,
            user: {
                id: userRecord.uid,
                name: name,
                email: email,
            },
        });
    }
    catch (error) {
        console.error('Erro no servidor ao registrar usuário:', error);
        if (error.code === 'auth/email-already-exists') {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
        res.status(500).json({ message: 'Ocorreu um erro no servidor. Tente novamente mais tarde.' });
    }
});
// Adicione aqui outras rotas (ex: /api/login)
// 5. INICIA O SERVIDOR (PARA TESTES LOCAIS)
// A Vercel ignora esta parte e usa a exportação abaixo
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
// 6. EXPORTAÇÃO DO APP PARA A VERCEL
module.exports = app;
