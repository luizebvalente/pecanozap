from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# ✅ CONFIGURAÇÃO CORS CORRIGIDA (SEM CREDENTIALS)
CORS(app, 
     origins=['https://pecanozap-new.vercel.app', 'https://*.vercel.app', 'http://localhost:5173'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=False)  # ← IMPORTANTE: False para evitar conflito com wildcard

# ✅ CONFIGURAÇÃO JWT
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY', 'sua-chave-secreta-super-segura-aqui')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# ✅ CONFIGURAÇÃO BANCO
if os.environ.get('DATABASE_URL'):
    database_url = os.environ.get('DATABASE_URL')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pecanozap.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ✅ MODELOS
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    business_name = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    city_id = db.Column(db.Integer, db.ForeignKey('city.id'), nullable=False)
    address = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    icon = db.Column(db.String(50), default='🏪')

class City(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(2), nullable=False)

# ✅ HANDLER PREFLIGHT ESPECÍFICO
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({'status': 'OK'})
        # ✅ CORS ESPECÍFICO PARA VERCEL (NÃO WILDCARD)
        response.headers.add("Access-Control-Allow-Origin", "https://pecanozap-new.vercel.app")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        return response

# ✅ ROTA DE HEALTH CHECK
@app.route('/')
def health_check():
    try:
        # Testar conexão com banco
        db.session.execute('SELECT 1')
        db_status = "connected"
        db_type = "PostgreSQL" if "postgresql" in app.config['SQLALCHEMY_DATABASE_URI'] else "SQLite"
    except Exception as e:
        db_status = f"error: {str(e)}"
        db_type = "unknown"
    
    return jsonify({
        'status': 'healthy',
        'message': 'Peça no Zap API está funcionando!',
        'database': {
            'status': db_status,
            'type': db_type
        },
        'cors': 'configured for Vercel',
        'jwt': 'configured',
        'timestamp': datetime.now().isoformat()
    }), 200

# ✅ ROTA DE LOGIN
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    try:
        app.logger.info(f"Login attempt from {request.remote_addr}")
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
            
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        user = User.query.filter_by(email=email).first()
        
        if not user:
            app.logger.warning(f"Usuário não encontrado: {email}")
            return jsonify({'error': 'Email ou senha inválidos'}), 401
        
        if not user.check_password(password):
            app.logger.warning(f"Senha incorreta para: {email}")
            return jsonify({'error': 'Email ou senha inválidos'}), 401
        
        access_token = create_access_token(
            identity={
                'user_id': user.id,
                'email': user.email,
                'business_name': user.business_name
            }
        )
        
        app.logger.info(f"Login bem-sucedido: {email}")
        
        return jsonify({
            'access_token': access_token,
            'user_id': user.id,
            'business_name': user.business_name,
            'email': user.email
        }), 200
        
    except Exception as e:
        app.logger.error(f"Erro no login: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ✅ ROTA DE REGISTRO
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        user = User(
            email=data['email'],
            business_name=data['business_name'],
            phone=data['phone'],
            category_id=data['category_id'],
            city_id=data['city_id'],
            address=data['address'],
            description=data.get('description', '')
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        app.logger.info(f"Usuário registrado: {data['email']}")
        
        return jsonify({
            'message': 'Usuário cadastrado com sucesso!',
            'user_id': user.id
        }), 201
        
    except Exception as e:
        app.logger.error(f"Erro no registro: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ✅ ROTA PROTEGIDA - DASHBOARD
@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    try:
        current_user = get_jwt_identity()
        user_id = current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        category = Category.query.get(user.category_id)
        city = City.query.get(user.city_id)
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'business_name': user.business_name,
                'phone': user.phone,
                'address': user.address,
                'description': user.description,
                'category': category.name if category else 'N/A',
                'city': f"{city.name}-{city.state}" if city else 'N/A',
                'created_at': user.created_at.isoformat()
            },
            'stats': {
                'total_views': 156,
                'whatsapp_clicks': 23,
                'rating': 4.5
            }
        }), 200
        
    except Exception as e:
        app.logger.error(f"Erro no dashboard: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ✅ ROTAS PÚBLICAS
@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([{
            'id': cat.id,
            'name': cat.name,
            'icon': cat.icon
        } for cat in categories])
    except Exception as e:
        app.logger.error(f"Erro ao buscar categorias: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/cities', methods=['GET'])
def get_cities():
    try:
        cities = City.query.all()
        return jsonify([{
            'id': city.id,
            'name': city.name,
            'state': city.state
        } for city in cities])
    except Exception as e:
        app.logger.error(f"Erro ao buscar cidades: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/businesses', methods=['GET'])
def get_businesses():
    try:
        # Por enquanto retorna dados mockados
        businesses = [
            {
                'id': 1,
                'name': 'Quintal da Villa Restaurante',
                'category': 'Restaurantes',
                'city': 'Ubatuba-SP',
                'phone': '12999887766',
                'address': 'Rua Guarani, 663 - Itaguá',
                'rating': 4.8,
                'description': 'Restaurante com vista para o mar'
            },
            {
                'id': 2,
                'name': 'Auto Comercial Taubaté',
                'category': 'Autopeças',
                'city': 'Ubatuba-SP',
                'phone': '12988776655',
                'address': 'Av Rio Grande do Sul, 274',
                'rating': 4.5,
                'description': 'Autopeças e acessórios automotivos'
            },
            {
                'id': 3,
                'name': 'Smidi Farma',
                'category': 'Farmácias',
                'city': 'Ubatuba-SP',
                'phone': '12977665544',
                'address': 'Praça 13 de Maio, 6 - Centro',
                'rating': 4.7,
                'description': 'Farmácia com delivery'
            }
        ]
        return jsonify(businesses)
    except Exception as e:
        app.logger.error(f"Erro ao buscar estabelecimentos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ✅ INICIALIZAÇÃO
def init_db():
    with app.app_context():
        db.create_all()
        
        # Criar categorias padrão
        if Category.query.count() == 0:
            categories = [
                Category(name='Restaurantes', icon='🍽️'),
                Category(name='Farmácias', icon='💊'),
                Category(name='Supermercados', icon='🛒'),
                Category(name='Autopeças', icon='🚗'),
                Category(name='Beleza', icon='💄'),
                Category(name='Roupas', icon='👕'),
                Category(name='Eletrônicos', icon='📱'),
                Category(name='Serviços', icon='🔧')
            ]
            for cat in categories:
                db.session.add(cat)
        
        # Criar cidades padrão
        if City.query.count() == 0:
            cities = [
                City(name='São Paulo', state='SP'),
                City(name='Rio de Janeiro', state='RJ'),
                City(name='Belo Horizonte', state='MG'),
                City(name='Salvador', state='BA'),
                City(name='Brasília', state='DF'),
                City(name='Fortaleza', state='CE'),
                City(name='Recife', state='PE'),
                City(name='Porto Alegre', state='RS'),
                City(name='Curitiba', state='PR'),
                City(name='Ubatuba', state='SP')
            ]
            for city in cities:
                db.session.add(city)
        
        db.session.commit()
        print("✅ Banco de dados inicializado com sucesso!")

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

