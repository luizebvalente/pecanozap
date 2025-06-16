from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from datetime import datetime, timedelta
import os

app = Flask(__name__)

# 🔥 CORS DEFINITIVO - ACEITA TUDO
CORS(app, 
     origins=['*'],  # Aceita qualquer origem
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['*'],  # Aceita qualquer header
     supports_credentials=True)  # Suporta credentials

# Configurações
app.config['JWT_SECRET_KEY'] = os.environ.get('SECRET_KEY', 'sua-chave-secreta')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Banco
if os.environ.get('DATABASE_URL'):
    database_url = os.environ.get('DATABASE_URL')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pecanozap.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelos
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

# 🔥 HANDLER CORS MANUAL
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Rotas
@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Peça no Zap API funcionando!',
        'cors': 'CONFIGURADO PARA ACEITAR TUDO'
    }), 200

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Email ou senha inválidos'}), 401
        
        access_token = create_access_token(identity={'user_id': user.id, 'email': user.email})
        
        return jsonify({
            'access_token': access_token,
            'user_id': user.id,
            'business_name': user.business_name,
            'email': user.email
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
        
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
        
        return jsonify({'message': 'Usuário cadastrado com sucesso!'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET', 'OPTIONS'])
def get_categories():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        categories = Category.query.all()
        return jsonify([{
            'id': cat.id,
            'name': cat.name,
            'icon': cat.icon
        } for cat in categories])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cities', methods=['GET', 'OPTIONS'])
def get_cities():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        cities = City.query.all()
        return jsonify([{
            'id': city.id,
            'name': city.name,
            'state': city.state
        } for city in cities])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/businesses', methods=['GET', 'OPTIONS'])
def get_businesses():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Dados mockados por enquanto
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
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard', methods=['GET', 'OPTIONS'])
@jwt_required()
def dashboard():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        current_user = get_jwt_identity()
        user_id = current_user['user_id']
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'business_name': user.business_name,
                'phone': user.phone,
                'address': user.address
            },
            'stats': {
                'total_views': 156,
                'whatsapp_clicks': 23,
                'rating': 4.5
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Inicialização
def init_db():
    with app.app_context():
        db.create_all()
        
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
        print("✅ Banco de dados inicializado!")

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

