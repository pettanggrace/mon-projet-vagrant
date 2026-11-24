// Métriques Prometheus de la todo-app (exposées sur GET /metrics)
const client = require('prom-client');
const db = require('./persistence');

const register = new client.Registry();
register.setDefaultLabels({ app: 'todo-app' });

// Métriques standard du process Node.js : CPU, mémoire, event loop, GC...
client.collectDefaultMetrics({ register });

// Nombre total de requêtes HTTP, par méthode / route / code de statut
const httpRequests = new client.Counter({
    name: 'http_requests_total',
    help: 'Nombre total de requêtes HTTP',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
});

// Durée des requêtes HTTP (histogramme -> permet de calculer p50/p95/p99)
const httpDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Durée des requêtes HTTP en secondes',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [register],
});

// Métrique "métier" : nombre de tâches, calculé au moment du scrape
new client.Gauge({
    name: 'todo_items',
    help: 'Nombre de tâches dans la base, par statut',
    labelNames: ['status'],
    registers: [register],
    async collect() {
        const items = await db.getItems();
        const done = items.filter((i) => Boolean(i.completed)).length;
        this.set({ status: 'completed' }, done);
        this.set({ status: 'pending' }, items.length - done);
    },
});

// Middleware Express : mesure chaque requête
function middleware(req, res, next) {
    if (req.path === '/metrics') return next();
    const end = httpDuration.startTimer();
    res.on('finish', () => {
        // On utilise le "pattern" de la route (/items/:id) et pas l'URL réelle,
        // pour éviter de créer une série par identifiant de tâche.
        const route = req.route ? req.baseUrl + req.route.path : 'static';
        const labels = { method: req.method, route, status: res.statusCode };
        httpRequests.inc(labels);
        end(labels);
    });
    next();
}

async function handler(req, res) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}

module.exports = { middleware, handler };
