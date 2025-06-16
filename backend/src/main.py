import os
import sys
# Adicionar pasta src ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

# Inicializar Flask
app = Flask(__name__)

# Configurações
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Configurar banco de dados
if os.environ.get('DATABASE_URL'):
    # Produção - PostgreSQL
    database_url = os.environ.get('DATABASE_URL')
    # Corrigir URL do PostgreSQL se necessário
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    # Desenvolvimento - SQLite
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pecanozap.db'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Inicializar extensões
db = SQLAlchemy(app)

# Configurar CORS
cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
CORS(app, origins=cors_origins)

# Modelos de dados
class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    businesses = db.relationship('User', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'business_count': len(self.businesses)
        }

class City(db.Model):
    __tablename__ = 'cities'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    businesses = db.relationship('User', backref='city', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'state': self.state,
            'business_count': len(self.businesses)
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    business_name = db.Column(db.String(200), nullable=False)
    owner_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    whatsapp = db.Column(db.String(20))
    address = db.Column(db.Text)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Chaves estrangeiras
    city_id = db.Column(db.Integer, db.ForeignKey('cities.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    
    # Relacionamentos
    reviews = db.relationship('Review', backref='business', lazy=True)
    
    @property
    def rating(self):
        if not self.reviews:
            return 0
        return sum(review.rating for review in self.reviews) / len(self.reviews)
    
    @property
    def review_count(self):
        return len(self.reviews)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'business_name': self.business_name,
            'owner_name': self.owner_name,
            'phone': self.phone,
            'whatsapp': self.whatsapp,
            'address': self.address,
            'description': self.description,
            'is_active': self.is_active,
            'city_id': self.city_id,
            'category_id': self.category_id,
            'city': self.city.to_dict() if self.city else None,
            'category': self.category.to_dict() if self.category else None,
            'rating': round(self.rating, 1),
            'review_count': self.review_count,
            'created_at': self.created_at.isoformat()
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(120))
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    # Chaves estrangeiras
    business_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'customer_name': self.customer_name,
            'rating': self.rating,
            'comment': self.comment,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat(),
            'business_id': self.business_id
        }

# Rotas de Health Check
@app.route('/')
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'Peça no Zap API está funcionando!',
        'version': '1.0.0',
        'endpoints': [
            '/api/register',
            '/api/login', 
            '/api/businesses',
            '/api/categories',
            '/api/cities',
            '/api/reviews'
        ]
    }), 200

@app.route('/health')
def health():
    return jsonify({'status': 'ok'}), 200

# Rotas da API
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['email', 'password', 'business_name', 'owner_name', 'city_id', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar novo usuário
        user = User(
            email=data['email'],
            business_name=data['business_name'],
            owner_name=data['owner_name'],
            phone=data.get('phone', ''),
            whatsapp=data.get('whatsapp', ''),
            address=data.get('address', ''),
            description=data.get('description', ''),
            city_id=data['city_id'],
            category_id=data['category_id']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'Estabelecimento cadastrado com sucesso!',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Email ou senha incorretos'}), 401
        
        # Simular token (em produção usar JWT)
        token = f"token_{user.id}_{datetime.datetime.utcnow().timestamp()}"
        
        return jsonify({
            'access_token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/businesses', methods=['GET'])
def get_businesses():
    try:
        # Filtros
        city_id = request.args.get('city_id')
        category_id = request.args.get('category_id')
        search = request.args.get('search', '')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 12))
        
        # Query base
        query = User.query.filter_by(is_active=True)
        
        # Aplicar filtros
        if city_id:
            query = query.filter_by(city_id=city_id)
        if category_id:
            query = query.filter_by(category_id=category_id)
        if search:
            query = query.filter(
                db.or_(
                    User.business_name.contains(search),
                    User.description.contains(search)
                )
            )
        
        # Paginação
        businesses = query.paginate(
            page=page, 
            per_page=per_page, 
            error_out=False
        )
        
        return jsonify({
            'businesses': [business.to_dict() for business in businesses.items],
            'total': businesses.total,
            'pages': businesses.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/businesses/<int:business_id>', methods=['GET'])
def get_business(business_id):
    try:
        business = User.query.get_or_404(business_id)
        return jsonify(business.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.all()
        return jsonify([category.to_dict() for category in categories]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cities', methods=['GET'])
def get_cities():
    try:
        cities = City.query.all()
        return jsonify([city.to_dict() for city in cities]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews', methods=['POST'])
def create_review():
    try:
        data = request.get_json()
        
        required_fields = ['business_id', 'customer_name', 'rating']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        if not (1 <= data['rating'] <= 5):
            return jsonify({'error': 'Avaliação deve ser entre 1 e 5'}), 400
        
        review = Review(
            business_id=data['business_id'],
            customer_name=data['customer_name'],
            customer_email=data.get('customer_email', ''),
            rating=data['rating'],
            comment=data.get('comment', ''),
            is_approved=True  # Auto-aprovar para demo
        )
        
        db.session.add(review)
        db.session.commit()
        
        return jsonify({
            'message': 'Avaliação criada com sucesso!',
            'review': review.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews/<int:business_id>', methods=['GET'])
def get_reviews(business_id):
    try:
        reviews = Review.query.filter_by(
            business_id=business_id, 
            is_approved=True
        ).order_by(Review.created_at.desc()).all()
        
        return jsonify([review.to_dict() for review in reviews]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_initial_data():
    """Criar dados iniciais"""
    
    # Categorias
    categories_data = [
        {'name': 'Restaurantes', 'description': 'Restaurantes e lanchonetes', 'icon': 'utensils'},
        {'name': 'Farmácias', 'description': 'Farmácias e drogarias', 'icon': 'pill'},
        {'name': 'Supermercados', 'description': 'Supermercados e mercearias', 'icon': 'shopping-cart'},
        {'name': 'Beleza', 'description': 'Salões de beleza e estética', 'icon': 'scissors'},
        {'name': 'Saúde', 'description': 'Clínicas e consultórios', 'icon': 'heart'},
        {'name': 'Educação', 'description': 'Escolas e cursos', 'icon': 'book'},
        {'name': 'Serviços', 'description': 'Prestadores de serviços', 'icon': 'wrench'},
        {'name': 'Comércio', 'description': 'Lojas e comércio em geral', 'icon': 'store'}
    ]
    
    for cat_data in categories_data:
        if not Category.query.filter_by(name=cat_data['name']).first():
            category = Category(**cat_data)
            db.session.add(category)
    
    # Cidades
    cities_data = [
        {'name': 'São Paulo', 'state': 'SP'},
        {'name': 'Rio de Janeiro', 'state': 'RJ'},
        {'name': 'Belo Horizonte', 'state': 'MG'},
        {'name': 'Salvador', 'state': 'BA'},
        {'name': 'Brasília', 'state': 'DF'},
        {'name': 'Fortaleza', 'state': 'CE'},
        {'name': 'Recife', 'state': 'PE'},
        {'name': 'Porto Alegre', 'state': 'RS'},
        {'name': 'Curitiba', 'state': 'PR'},
        {'name': 'Goiânia', 'state': 'GO'}
    ]
    
    for city_data in cities_data:
        if not City.query.filter_by(name=city_data['name'], state=city_data['state']).first():
            city = City(**city_data)
            db.session.add(city)
    
    db.session.commit()

if __name__ == '__main__':
    # Criar tabelas e dados iniciais
    with app.app_context():
        try:
            db.create_all()
            create_initial_data()
            print("✅ Banco de dados inicializado com sucesso!")
        except Exception as e:
            print(f"❌ Erro ao inicializar banco: {e}")
    
    # Iniciar servidor
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"🚀 Iniciando servidor na porta {port}")
    print(f"🌐 Modo debug: {debug_mode}")
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)

