
function App() {
    const { Container, Row, Col } = ReactBootstrap;
    return (
        <React.Fragment>
            <header className="hero">
                <Container>
                    <Row>
                        <Col md={{ offset: 2, span: 8 }}>
                            <div className="hero-brand">
                                <span className="hero-logo">
                                    <i className="fas fa-stream" />
                                </span>
                                <span className="hero-name">TO-DO-LIST</span>
                            </div>
                            <h1 className="hero-title">Organisez vos tâches, simplement.</h1>
                            <div className="hero-stack">
                                <span><i className="fab fa-docker" /> Docker</span>
                                <span><i className="fab fa-github" /> GitHub Actions</span>
                                <span><i className="fas fa-server" /> Vagrant</span>
                                <span><i className="fas fa-chart-line" /> Prometheus · Grafana</span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </header>
            <Container>
                <Row>
                    <Col md={{ offset: 2, span: 8 }}>
                        <main className="panel">
                            <TodoListCard />
                        </main>
                        <footer className="footer">
                            Projet DevOps · B3 · Semestre 1
                        </footer>
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    );
}

function TodoListCard() {
    const [items, setItems] = React.useState(null);
    const [filter, setFilter] = React.useState('all');

    React.useEffect(() => {
        fetch('/items')
            .then(r => r.json())
            .then(setItems);
    }, []);

    const onNewItem = React.useCallback(
        newItem => {
            setItems([...items, newItem]);
        },
        [items],
    );

    const onItemUpdate = React.useCallback(
        item => {
            const index = items.findIndex(i => i.id === item.id);
            setItems([
                ...items.slice(0, index),
                item,
                ...items.slice(index + 1),
            ]);
        },
        [items],
    );

    const onItemRemoval = React.useCallback(
        item => {
            const index = items.findIndex(i => i.id === item.id);
            setItems([...items.slice(0, index), ...items.slice(index + 1)]);
        },
        [items],
    );

    if (items === null) return <p className="text-center muted">Chargement…</p>;

    const done = items.filter(i => i.completed).length;
    const percent = items.length ? Math.round((done / items.length) * 100) : 0;
    const visible = items.filter(i =>
        filter === 'all' ? true : filter === 'done' ? i.completed : !i.completed,
    );

    return (
        <React.Fragment>
            <AddItemForm onNewItem={onNewItem} />

            {items.length > 0 && (
                <div className="progress-block">
                    <div className="progress-label">
                        <span>Progression</span>
                        <strong>{done} / {items.length} terminée{done > 1 ? 's' : ''} · {percent} %</strong>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: percent + '%' }} />
                    </div>
                </div>
            )}

            {items.length > 0 && (
                <div className="filters">
                    {[
                        ['all', 'Toutes', items.length],
                        ['todo', 'En cours', items.length - done],
                        ['done', 'Terminées', done],
                    ].map(([key, label, count]) => (
                        <button
                            key={key}
                            type="button"
                            className={'filter' + (filter === key ? ' active' : '')}
                            onClick={() => setFilter(key)}
                        >
                            {label} <span className="count">{count}</span>
                        </button>
                    ))}
                </div>
            )}

            {items.length === 0 && (
                <div className="empty">
                    <i className="fas fa-clipboard-list" />
                    <p>Aucune tâche ! Déployé automatiquement par GitHub Actions 🚀</p>
                </div>
            )}

            {items.length > 0 && visible.length === 0 && (
                <p className="text-center muted">Rien à afficher dans ce filtre.</p>
            )}

            {visible.map(item => (
                <ItemDisplay
                    item={item}
                    key={item.id}
                    onItemUpdate={onItemUpdate}
                    onItemRemoval={onItemRemoval}
                />
            ))}
        </React.Fragment>
    );
}

function AddItemForm({ onNewItem }) {
    const { Form, InputGroup, Button } = ReactBootstrap;

    const [newItem, setNewItem] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const submitNewItem = e => {
        e.preventDefault();
        setSubmitting(true);
        fetch('/items', {
            method: 'POST',
            body: JSON.stringify({ name: newItem }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(item => {
                onNewItem(item);
                setSubmitting(false);
                setNewItem('');
            });
    };

    return (
        <Form onSubmit={submitNewItem}>
            <InputGroup className="mb-3 add-form">
                <Form.Control
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    type="text"
                    placeholder="Que devez-vous faire ?"
                    aria-label="Nouvelle tâche"
                />
                <InputGroup.Append>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!newItem.length}
                        className={submitting ? 'disabled' : ''}
                    >
                        <i className="fas fa-plus" /> {submitting ? 'Ajout…' : 'Ajouter'}
                    </Button>
                </InputGroup.Append>
            </InputGroup>
        </Form>
    );
}

function ItemDisplay({ item, onItemUpdate, onItemRemoval }) {
    const { Container, Row, Col, Button } = ReactBootstrap;

    const toggleCompletion = () => {
        fetch(`/items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: item.name,
                completed: !item.completed,
            }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then(r => r.json())
            .then(onItemUpdate);
    };

    const removeItem = () => {
        fetch(`/items/${item.id}`, { method: 'DELETE' }).then(() =>
            onItemRemoval(item),
        );
    };

    return (
        <Container fluid className={`item ${item.completed ? 'completed' : ''}`}>
            <Row>
                <Col xs={1} className="text-center">
                    <Button
                        className="toggles"
                        size="sm"
                        variant="link"
                        onClick={toggleCompletion}
                        aria-label={
                            item.completed
                                ? 'Marquer comme non terminée'
                                : 'Marquer comme terminée'
                        }
                    >
                        <i
                            className={`${
                                item.completed ? 'fas fa-check-circle' : 'far fa-circle'
                            }`}
                        />
                    </Button>
                </Col>
                <Col xs={10} className="name">
                    {item.name}
                </Col>
                <Col xs={1} className="text-center remove">
                    <Button
                        size="sm"
                        variant="link"
                        onClick={removeItem}
                        aria-label="Supprimer la tâche"
                    >
                        <i className="far fa-trash-alt" />
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
