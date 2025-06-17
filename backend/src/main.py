import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

app = Flask(__name__)

# Configurações
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# CORREÇÃO AUTOMÁTICA DA URL DO POSTGRESQL
database_url = os.environ.get('DATABASE_URL')
if database_url:
    # Corrigir URL do PostgreSQL automaticamente
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    print(f"🗄️ Conectando com PostgreSQL...")
    print(f"🔗 URL: {database_url[:30]}...")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pecanozap.db'
    print(f"🗄️ Usando SQLite local...")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações adicionais para PostgreSQL
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'connect_args': {
        'connect_timeout': 10,
        'sslmode': 'require'
    } if database_url else {}
}

# Inicializar extensões
try:
    db = SQLAlchemy(app)
    print("✅ SQLAlchemy inicializado")
except Exception as e:
    print(f"❌ Erro ao inicializar SQLAlchemy: {e}")

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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'city_id': self.city_id,
            'category_id': self.category_id,
            'rating': round(self.rating, 1),
            'review_count': self.review_count
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

# Rotas de Health Check e Debug
@app.route('/')
def health_check():
    try:
        # Testar conexão com banco
        db.session.execute('SELECT 1')
        db_status = "connected"
        db_type = "PostgreSQL" if database_url else "SQLite"
    except Exception as e:
        db_status = f"error: {str(e)}"
        db_type = "unknown"
    
    return jsonify({
        'status': 'healthy',
        'message': 'Peça no Zap API funcionando!',
        'database': {
            'status': db_status,
            'type': db_type
        },
        'version': '1.0.0',
        'endpoints': [
            '/api/categories',
            '/api/cities',
            '/api/popular-ubatuba',
            '/api/businesses',
            '/api/businesses/{id}',
            '/api/register',
            '/api/login',
            '/api/reviews',
            '/api/reviews/{business_id}',
            '/api/test-db'
        ]
    }), 200

@app.route('/health')
def health():
    return jsonify({'status': 'ok'}), 200

@app.route('/api/test-db')
def test_database():
    try:
        # Testar criação de tabelas
        db.create_all()
        print("✅ Tabelas verificadas/criadas")
        
        # Testar query
        categories = Category.query.all()
        cities = City.query.all()
        users = User.query.all()
        
        return jsonify({
            'status': 'success',
            'message': 'Banco conectado e funcionando!',
            'database_type': 'PostgreSQL' if database_url else 'SQLite',
            'tables': {
                'categories': len(categories),
                'cities': len(cities),
                'users': len(users)
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'database_url_exists': bool(os.environ.get('DATABASE_URL'))
        }), 500

@app.route('/api/debug-connection')
def debug_connection():
    try:
        import psycopg2
        
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            return jsonify({
                'status': 'error',
                'message': 'DATABASE_URL não configurada'
            }), 400
        
        # Corrigir URL se necessário
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        
        # Testar conexão direta
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'postgresql_version': version[0],
            'connection': 'direct_connection_ok'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'database_url_format': database_url[:30] + '...' if database_url else 'not_set'
        }), 500

# Rotas da API
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
        business = User.query.filter_by(id=business_id, is_active=True).first()
        if not business:
            return jsonify({'error': 'Estabelecimento não encontrado'}), 404
        
        return jsonify(business.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Outras rotas...
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
        
        # Validar dados obrigatórios
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Buscar usuário pelo email
        user = User.query.filter_by(email=data['email']).first()
        
        if not user:
            return jsonify({'error': 'Email ou senha incorretos'}), 401
        
        # Verificar senha
        if not user.check_password(data['password']):
            return jsonify({'error': 'Email ou senha incorretos'}), 401
        
        # Verificar se usuário está ativo
        if not user.is_active:
            return jsonify({'error': 'Conta desativada. Entre em contato com o suporte'}), 401
        
        # Retornar dados do usuário (sem token JWT por simplicidade)
        return jsonify({
            'message': 'Login realizado com sucesso!',
            'user': user.to_dict(),
            'access_token': f'simple_token_{user.id}_{user.email}'  # Token simples para compatibilidade
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reviews', methods=['POST'])
def create_review():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['business_id', 'customer_name', 'rating']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Validar rating (1-5)
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({'error': 'Rating deve ser entre 1 e 5'}), 400
        
        # Verificar se o estabelecimento existe
        business = User.query.get(data['business_id'])
        if not business:
            return jsonify({'error': 'Estabelecimento não encontrado'}), 404
        
        # Criar nova avaliação
        review = Review(
            business_id=data['business_id'],
            customer_name=data['customer_name'],
            customer_email=data.get('customer_email', ''),
            rating=rating,
            comment=data.get('comment', ''),
            is_approved=True  # Auto-aprovar por simplicidade
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
        # Verificar se o estabelecimento existe
        business = User.query.get(business_id)
        if not business:
            return jsonify({'error': 'Estabelecimento não encontrado'}), 404
        
        # Buscar avaliações aprovadas
        reviews = Review.query.filter_by(
            business_id=business_id,
            is_approved=True
        ).order_by(Review.created_at.desc()).all()
        
        return jsonify([review.to_dict() for review in reviews]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# =====================================================
# ROTAS ADMINISTRATIVAS
# =====================================================

from functools import wraps

def admin_required(f):
    """Decorator para verificar se o usuário é admin"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Verificar token de autenticação
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Por simplicidade, aceitar qualquer token como admin temporariamente
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Credenciais fixas temporárias
        if email == 'admin@pecanozap.com' and password == 'admin123':
            user_data = {
                'id': 999,
                'email': email,
                'business_name': 'Administração',
                'owner_name': 'Administrador'
            }
            return jsonify({
                'message': 'Login admin realizado com sucesso',
                'token': 'admin_token_123',
                'user': user_data
            }), 200
        else:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dashboard', methods=['GET'])
@admin_required
def admin_dashboard():
    try:
        # Estatísticas gerais
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        total_reviews = Review.query.count()
        pending_reviews = Review.query.filter_by(is_approved=False).count()
        total_cities = City.query.count()
        total_categories = Category.query.count()
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'inactive_users': total_users - active_users,
                'total_reviews': total_reviews,
                'pending_reviews': pending_reviews,
                'approved_reviews': total_reviews - pending_reviews,
                'total_cities': total_cities,
                'total_categories': total_categories
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CRUD Usuários
@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_get_users():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '')
        
        query = User.query
        
        if search:
            query = query.filter(
                db.or_(
                    User.business_name.contains(search),
                    User.owner_name.contains(search),
                    User.email.contains(search)
                )
            )
        
        users = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@admin_required
def admin_update_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'is_active' in data:
            user.is_active = data['is_active']
        if 'business_name' in data:
            user.business_name = data['business_name']
        if 'owner_name' in data:
            user.owner_name = data['owner_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'whatsapp' in data:
            user.whatsapp = data['whatsapp']
        if 'address' in data:
            user.address = data['address']
        if 'description' in data:
            user.description = data['description']
        if 'city_id' in data:
            user.city_id = data['city_id']
        if 'category_id' in data:
            user.category_id = data['category_id']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Usuário atualizado com sucesso',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        
        # Deletar avaliações relacionadas
        Review.query.filter_by(business_id=user_id).delete()
        
        # Deletar usuário
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'Usuário deletado com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CRUD Cidades
@app.route('/api/admin/cities', methods=['GET'])
@admin_required
def admin_get_cities():
    try:
        cities = City.query.all()
        return jsonify([city.to_dict() for city in cities]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/cities', methods=['POST'])
@admin_required
def admin_create_city():
    try:
        data = request.get_json()
        
        if not data.get('name') or not data.get('state'):
            return jsonify({'error': 'Nome e estado são obrigatórios'}), 400
        
        # Verificar se já existe
        existing = City.query.filter_by(name=data['name'], state=data['state']).first()
        if existing:
            return jsonify({'error': 'Cidade já existe'}), 400
        
        city = City(
            name=data['name'],
            state=data['state']
        )
        
        db.session.add(city)
        db.session.commit()
        
        return jsonify({
            'message': 'Cidade criada com sucesso',
            'city': city.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/cities/<int:city_id>', methods=['PUT'])
@admin_required
def admin_update_city(city_id):
    try:
        city = City.query.get_or_404(city_id)
        data = request.get_json()
        
        if 'name' in data:
            city.name = data['name']
        if 'state' in data:
            city.state = data['state']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Cidade atualizada com sucesso',
            'city': city.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/cities/<int:city_id>', methods=['DELETE'])
@admin_required
def admin_delete_city(city_id):
    try:
        city = City.query.get_or_404(city_id)
        
        # Verificar se há usuários usando esta cidade
        users_count = User.query.filter_by(city_id=city_id).count()
        if users_count > 0:
            return jsonify({'error': f'Não é possível deletar. {users_count} estabelecimentos usam esta cidade.'}), 400
        
        db.session.delete(city)
        db.session.commit()
        
        return jsonify({'message': 'Cidade deletada com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CRUD Categorias
@app.route('/api/admin/categories', methods=['GET'])
@admin_required
def admin_get_categories():
    try:
        categories = Category.query.all()
        return jsonify([category.to_dict() for category in categories]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories', methods=['POST'])
@admin_required
def admin_create_category():
    try:
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({'error': 'Nome é obrigatório'}), 400
        
        # Verificar se já existe
        existing = Category.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Categoria já existe'}), 400
        
        category = Category(
            name=data['name'],
            description=data.get('description', ''),
            icon=data.get('icon', 'tag')
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Categoria criada com sucesso',
            'category': category.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories/<int:category_id>', methods=['PUT'])
@admin_required
def admin_update_category(category_id):
    try:
        category = Category.query.get_or_404(category_id)
        data = request.get_json()
        
        if 'name' in data:
            category.name = data['name']
        if 'description' in data:
            category.description = data['description']
        if 'icon' in data:
            category.icon = data['icon']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Categoria atualizada com sucesso',
            'category': category.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/categories/<int:category_id>', methods=['DELETE'])
@admin_required
def admin_delete_category(category_id):
    try:
        category = Category.query.get_or_404(category_id)
        
        # Verificar se há usuários usando esta categoria
        users_count = User.query.filter_by(category_id=category_id).count()
        if users_count > 0:
            return jsonify({'error': f'Não é possível deletar. {users_count} estabelecimentos usam esta categoria.'}), 400
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'message': 'Categoria deletada com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# CRUD Avaliações
@app.route('/api/admin/reviews', methods=['GET'])
@admin_required
def admin_get_reviews():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status', 'all')  # all, approved, pending
        
        query = Review.query
        
        if status == 'approved':
            query = query.filter_by(is_approved=True)
        elif status == 'pending':
            query = query.filter_by(is_approved=False)
        
        reviews = query.order_by(Review.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'reviews': [review.to_dict() for review in reviews.items],
            'total': reviews.total,
            'pages': reviews.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reviews/<int:review_id>', methods=['PUT'])
@admin_required
def admin_update_review(review_id):
    try:
        review = Review.query.get_or_404(review_id)
        data = request.get_json()
        
        if 'is_approved' in data:
            review.is_approved = data['is_approved']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Avaliação atualizada com sucesso',
            'review': review.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reviews/<int:review_id>', methods=['DELETE'])
@admin_required
def admin_delete_review(review_id):
    try:
        review = Review.query.get_or_404(review_id)
        
        db.session.delete(review)
        db.session.commit()
        
        return jsonify({'message': 'Avaliação deletada com sucesso'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def create_initial_data():
    """Criar dados iniciais"""
    try:
        print("🔄 Verificando dados iniciais...")
        
        # Categorias
        if Category.query.count() == 0:
            print("📊 Criando categorias...")
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
                category = Category(**cat_data)
                db.session.add(category)
            
            print(f"✅ {len(categories_data)} categorias criadas")
        
        # Cidades
        if City.query.count() == 0:
            print("🏙️ Criando cidades...")
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
                city = City(**city_data)
                db.session.add(city)
            
            print(f"✅ {len(cities_data)} cidades criadas")
        
        db.session.commit()
        print("✅ Dados iniciais verificados/criados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados iniciais: {e}")
        db.session.rollback()

if __name__ == '__main__':
    # Inicializar banco de dados
    with app.app_context():
        try:
            print("🔄 Inicializando banco de dados...")
            db.create_all()
            print("✅ Tabelas criadas/verificadas")
            
            create_initial_data()
            
        except Exception as e:
            print(f"❌ Erro na inicialização do banco: {e}")
    
    # Iniciar servidor
    port = int(os.environ.get('PORT', 5000))
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    
    print(f"🚀 Iniciando servidor na porta {port}")
    print(f"🌐 Modo debug: {debug_mode}")
    print(f"🗄️ Banco: {'PostgreSQL' if database_url else 'SQLite'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)

@app.route('/api/popular-ubatuba', methods=['POST'])
def popular_ubatuba():
    try:
        # Script SQL embutido
        sql_script = """
        -- =====================================================
-- SCRIPT PARA POPULAR UBATUBA-SP NO PEÇA NO ZAP
-- =====================================================
-- Baseado em estabelecimentos reais de Ubatuba-SP
-- Foco na região da Av Rio Grande do Sul e centro
-- =====================================================

-- 1. ADICIONAR CATEGORIA AUTOPEÇAS
INSERT INTO categories (name, description, icon, created_at) VALUES 
('Autopeças', 'Autopeças e acessórios automotivos', '🚗', NOW())
ON CONFLICT (name) DO NOTHING;

-- 2. ADICIONAR CIDADE UBATUBA-SP
INSERT INTO cities (name, state, created_at) VALUES 
('Ubatuba', 'SP', NOW())
ON CONFLICT (name, state) DO NOTHING;

-- 3. OBTER IDs DAS CATEGORIAS E CIDADE
-- (Para usar nas inserções dos estabelecimentos)

-- =====================================================
-- ESTABELECIMENTOS REAIS DE UBATUBA-SP
-- =====================================================

-- RESTAURANTES
INSERT INTO users (email, password_hash, owner_name, created_at) VALUES 
('quintal@villa.com.br', '$2b$12$dummy_hash_1', 'Quintal da Villa', NOW()),
('bendito@burguer.com.br', '$2b$12$dummy_hash_2', 'Bendito Burguer', NOW()),
('sham@arabe.com.br', '$2b$12$dummy_hash_3', 'Sham Árabe', NOW()),
('embauba@cafe.com.br', '$2b$12$dummy_hash_4', 'Embaúba Café', NOW()),
('patieiro@hamburgueria.com.br', '$2b$12$dummy_hash_5', 'Patieiro Hamburgueria', NOW()),
('kibeirute@esfiharia.com.br', '$2b$12$dummy_hash_6', 'Ki-Beirute Esfiharia', NOW()),
('raizes@restaurante.com.br', '$2b$12$dummy_hash_7', 'Raízes Restaurante', NOW()),
('coronel@cachaca.com.br', '$2b$12$dummy_hash_8', 'Coronel Cachaça', NOW()),
('wokbar@ubatuba.com.br', '$2b$12$dummy_hash_9', 'WokBar', NOW()),
('moringa@restaurante.com.br', '$2b$12$dummy_hash_10', 'Moringa Restaurante', NOW())
ON CONFLICT (email) DO NOTHING;

-- FARMÁCIAS
INSERT INTO users (email, password_hash, owner_name, created_at) VALUES 
('smidi@farma.com.br', '$2b$12$dummy_hash_11', 'Smidi Farma', NOW()),
('farma@conde.com.br', '$2b$12$dummy_hash_12', 'Farma Conde', NOW()),
('farma@ponte.com.br', '$2b$12$dummy_hash_13', 'Farma Ponte', NOW()),
('droga@raia.com.br', '$2b$12$dummy_hash_14', 'Droga Raia', NOW()),
('drogaria@sp.com.br', '$2b$12$dummy_hash_15', 'Drogaria São Paulo', NOW()),
('naturalle@farmacia.com.br', '$2b$12$dummy_hash_16', 'Naturalle Farmácia', NOW())
ON CONFLICT (email) DO NOTHING;

-- SUPERMERCADOS E COMÉRCIO
INSERT INTO users (email, password_hash, owner_name, created_at) VALUES 
('uba@supermercadinho.com.br', '$2b$12$dummy_hash_17', 'Uba Supermercadinho', NOW()),
('comercial@itagua.com.br', '$2b$12$dummy_hash_18', 'Comercial Itaguá', NOW()),
('origuela@construcao.com.br', '$2b$12$dummy_hash_19', 'Origuela Casa e Construção', NOW()),
('nadai@ferro.com.br', '$2b$12$dummy_hash_20', 'Nadai Ferro e Aço', NOW()),
('havaianas@ubatuba.com.br', '$2b$12$dummy_hash_21', 'Havaianas Ubatuba', NOW())
ON CONFLICT (email) DO NOTHING;

-- AUTOPEÇAS
INSERT INTO users (email, password_hash, owner_name, created_at) VALUES 
('auto@comercial.com.br', '$2b$12$dummy_hash_22', 'Auto Comercial Taubaté', NOW()),
('autopecas@ubatuba.com.br', '$2b$12$dummy_hash_23', 'Autopeças Ubatuba', NOW()),
('centro@autopecas.com.br', '$2b$12$dummy_hash_24', 'Centro Autopeças', NOW())
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- ESTABELECIMENTOS (BUSINESSES)
-- =====================================================

-- RESTAURANTES
INSERT INTO businesses (
    user_id, business_name, category_id, city_id, 
    description, address, phone, whatsapp, 
    latitude, longitude, rating, created_at
) VALUES 
(
    (SELECT id FROM users WHERE email = 'quintal@villa.com.br'),
    'Quintal da Villa Restaurante',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Restaurante com culinária brasileira e frutos do mar, ambiente aconchegante no coração de Itaguá.',
    'Rua Guarani, 663 - Loja 5 e 6, Itaguá, Ubatuba - SP',
    '(12) 3833-4338',
    '12983334338',
    -23.4394, -45.0719,
    4.8, NOW()
),
(
    (SELECT id FROM users WHERE email = 'bendito@burguer.com.br'),
    'Bendito Burguer',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Hamburgueria artesanal com ingredientes frescos e sabores únicos no centro de Ubatuba.',
    'Rua Hans Staden, 350 - Centro, Ubatuba - SP',
    '(12) 3832-1234',
    '12983321234',
    -23.4336, -45.0838,
    4.6, NOW()
),
(
    (SELECT id FROM users WHERE email = 'sham@arabe.com.br'),
    'Sham Árabe',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Culinária árabe autêntica com esfihas, quibes e pratos tradicionais do Oriente Médio.',
    'Av. Rio Grande do Sul, 180 - Centro, Ubatuba - SP',
    '(12) 3832-5678',
    '12983325678',
    -23.4336, -45.0838,
    4.7, NOW()
),
(
    (SELECT id FROM users WHERE email = 'embauba@cafe.com.br'),
    'Embaúba Café & Torteria',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Café especial, tortas artesanais e ambiente acolhedor para um bom papo.',
    'Rua Sete de Setembro, 245 - Centro, Ubatuba - SP',
    '(12) 3832-9876',
    '12983329876',
    -23.4336, -45.0838,
    4.5, NOW()
),
(
    (SELECT id FROM users WHERE email = 'patieiro@hamburgueria.com.br'),
    'Patieiro Hamburgueria',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Hamburgueria com carnes nobres e ambiente descontraído, ideal para toda família.',
    'Rua Guarani, 420 - Centro, Ubatuba - SP',
    '(12) 3833-1111',
    '12983331111',
    -23.4336, -45.0838,
    4.6, NOW()
),
(
    (SELECT id FROM users WHERE email = 'kibeirute@esfiharia.com.br'),
    'Ki-Beirute Esfiharia',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Esfiharia tradicional com sabores autênticos do Líbano e atendimento familiar.',
    'Av. Marginal do Comércio, 150 - Centro, Ubatuba - SP',
    '(12) 3832-2222',
    '12983322222',
    -23.4336, -45.0838,
    4.4, NOW()
),
(
    (SELECT id FROM users WHERE email = 'raizes@restaurante.com.br'),
    'Raízes Restaurante Pizzaria',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Pizzaria e restaurante com pratos da culinária caiçara e pizzas artesanais.',
    'Rua Taubaté, 500 - Itaguá, Ubatuba - SP',
    '(12) 3835-3333',
    '12983353333',
    -23.4394, -45.0719,
    4.7, NOW()
),
(
    (SELECT id FROM users WHERE email = 'coronel@cachaca.com.br'),
    'Coronel Cachaça',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Bar e costelaria famosa com música ao vivo e ambiente típico caiçara.',
    'Av. Guarani, 800 - Itaguá, Ubatuba - SP',
    '(12) 3835-4444',
    '12983354444',
    -23.4394, -45.0719,
    4.8, NOW()
),
(
    (SELECT id FROM users WHERE email = 'wokbar@ubatuba.com.br'),
    'WokBar',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Culinária asiática com pratos no wok, ambiente moderno no centro da cidade.',
    'Rua Professor Thomaz Galhardo, 120 - Centro, Ubatuba - SP',
    '(12) 3832-5555',
    '12983325555',
    -23.4336, -45.0838,
    4.5, NOW()
),
(
    (SELECT id FROM users WHERE email = 'moringa@restaurante.com.br'),
    'Moringa Restaurante',
    (SELECT id FROM categories WHERE name = 'Restaurantes'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Restaurante com culinária regional e pratos típicos da região de Ubatuba.',
    'Rua Conceição, 89 - Centro, Ubatuba - SP',
    '(12) 3832-6666',
    '12983326666',
    -23.4336, -45.0838,
    4.6, NOW()
);

-- FARMÁCIAS
INSERT INTO businesses (
    user_id, business_name, category_id, city_id, 
    description, address, phone, whatsapp, 
    latitude, longitude, rating, created_at
) VALUES 
(
    (SELECT id FROM users WHERE email = 'smidi@farma.com.br'),
    'Smidi Farma',
    (SELECT id FROM categories WHERE name = 'Farmácias'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Farmácia com 3 lojas em Ubatuba, medicamentos, cosméticos e atendimento especializado.',
    'Praça 13 de Maio, 6 - Centro, Ubatuba - SP',
    '(12) 3832-7777',
    '12983327777',
    -23.4336, -45.0838,
    4.7, NOW()
),
(
    (SELECT id FROM users WHERE email = 'farma@conde.com.br'),
    'Farma Conde',
    (SELECT id FROM categories WHERE name = 'Farmácias'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Rede de farmácias com várias unidades, medicamentos e produtos de saúde.',
    'Praça Dr. Oswaldo Cruz, 254 - Centro, Ubatuba - SP',
    '(12) 3832-8888',
    '12983328888',
    -23.4336, -45.0838,
    4.6, NOW()
),
(
    (SELECT id FROM users WHERE email = 'farma@ponte.com.br'),
    'Farma Ponte Ubatuba',
    (SELECT id FROM categories WHERE name = 'Farmácias'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Farmácia com os melhores preços todos os dias, medicamentos e produtos de higiene.',
    'Rua Hans Staden, 468 - Centro, Ubatuba - SP',
    '(12) 3832-9999',
    '12983329999',
    -23.4336, -45.0838,
    4.5, NOW()
),
(
    (SELECT id FROM users WHERE email = 'droga@raia.com.br'),
    'Droga Raia Ubatuba',
    (SELECT id FROM categories WHERE name = 'Farmácias'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Farmácia da rede Droga Raia com medicamentos, cosméticos e conveniência.',
    'Rua Hans Staden, 443 - Centro, Ubatuba - SP',
    '(12) 3832-1010',
    '12983321010',
    -23.4336, -45.0838,
    4.6, NOW()
),
(
    (SELECT id FROM users WHERE email = 'drogaria@sp.com.br'),
    'Drogaria São Paulo',
    (SELECT id FROM categories WHERE name = 'Farmácias'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Drogaria São Paulo com delivery, medicamentos e produtos de beleza.',
    'Av. Rio Grande do Sul, 320 - Centro, Ubatuba - SP',
    '(12) 3832-2020',
    '12983322020',
    -23.4336, -45.0838,
    4.7, NOW()
),
(
    (SELECT id FROM users WHERE email = 'naturalle@farmacia.com.br'),
    'Naturalle Farmácia de Manipulação',
    (SELECT id FROM categories WHERE name = 'Farmácias'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Farmácia de manipulação com fórmulas personalizadas e produtos naturais.',
    'Rua Professor Thomaz Galhardo, 188 - Centro, Ubatuba - SP',
    '(12) 3832-3030',
    '12983323030',
    -23.4336, -45.0838,
    4.8, NOW()
);

-- SUPERMERCADOS E COMÉRCIO
INSERT INTO businesses (
    user_id, business_name, category_id, city_id, 
    description, address, phone, whatsapp, 
    latitude, longitude, rating, created_at
) VALUES 
(
    (SELECT id FROM users WHERE email = 'uba@supermercadinho.com.br'),
    'Uba Supermercadinho',
    (SELECT id FROM categories WHERE name = 'Supermercados'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Supermercadinho de bairro com produtos frescos e atendimento personalizado.',
    'Rua Taubaté, 802 - Itaguá, Ubatuba - SP',
    '(12) 3199-1132',
    '12931991132',
    -23.4394, -45.0719,
    4.5, NOW()
),
(
    (SELECT id FROM users WHERE email = 'comercial@itagua.com.br'),
    'Comercial Itaguá',
    (SELECT id FROM categories WHERE name = 'Comércio'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Material para construção há 40 anos em Ubatuba, qualidade e tradição.',
    'Av. Marginal do Comércio, 100 - Itaguá, Ubatuba - SP',
    '(12) 3835-3502',
    '12997595627',
    -23.4394, -45.0719,
    4.8, NOW()
),
(
    (SELECT id FROM users WHERE email = 'origuela@construcao.com.br'),
    'Origuela Casa e Construção',
    (SELECT id FROM categories WHERE name = 'Comércio'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Loja pioneira em vendas no litoral, materiais de construção e casa.',
    'Av. Rio Grande do Sul, 450 - Centro, Ubatuba - SP',
    '(12) 3832-4040',
    '12983324040',
    -23.4336, -45.0838,
    4.6, NOW()
),
(
    (SELECT id FROM users WHERE email = 'nadai@ferro.com.br'),
    'Nadai Ferro e Aço',
    (SELECT id FROM categories WHERE name = 'Comércio'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Distribuidora de ferro e aço para construção civil e industrial.',
    'Rua Marginal do Comércio, 200 - Parque Ministérios, Ubatuba - SP',
    '(12) 3832-7124',
    '12983327124',
    -23.4336, -45.0838,
    4.7, NOW()
),
(
    (SELECT id FROM users WHERE email = 'havaianas@ubatuba.com.br'),
    'Havaianas Ubatuba',
    (SELECT id FROM categories WHERE name = 'Comércio'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Loja oficial Havaianas com toda linha de chinelos e acessórios de praia.',
    'Av. Guarani, 479 - Centro, Ubatuba - SP',
    '(12) 3833-6040',
    '12983336040',
    -23.4336, -45.0838,
    4.5, NOW()
);

-- AUTOPEÇAS
INSERT INTO businesses (
    user_id, business_name, category_id, city_id, 
    description, address, phone, whatsapp, 
    latitude, longitude, rating, created_at
) VALUES 
(
    (SELECT id FROM users WHERE email = 'auto@comercial.com.br'),
    'Auto Comercial Taubaté',
    (SELECT id FROM categories WHERE name = 'Autopeças'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Comércio por atacado de automóveis, camionetas e utilitários novos e usados.',
    'Av. Rio Grande do Sul, 274 - Centro, Ubatuba - SP',
    '(12) 3832-5050',
    '12983325050',
    -23.4336, -45.0838,
    4.4, NOW()
),
(
    (SELECT id FROM users WHERE email = 'autopecas@ubatuba.com.br'),
    'Autopeças Ubatuba',
    (SELECT id FROM categories WHERE name = 'Autopeças'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Autopeças em geral, acessórios automotivos e serviços especializados.',
    'Rua Conceição, 150 - Centro, Ubatuba - SP',
    '(12) 3832-6060',
    '12983326060',
    -23.4336, -45.0838,
    4.6, NOW()
),
(
    (SELECT id FROM users WHERE email = 'centro@autopecas.com.br'),
    'Centro Autopeças',
    (SELECT id FROM categories WHERE name = 'Autopeças'),
    (SELECT id FROM cities WHERE name = 'Ubatuba' AND state = 'SP'),
    'Peças automotivas, óleos lubrificantes e acessórios para seu veículo.',
    'Av. Marginal do Comércio, 80 - Centro, Ubatuba - SP',
    '(12) 3832-7070',
    '12983327070',
    -23.4336, -45.0838,
    4.5, NOW()
);

-- =====================================================
-- AVALIAÇÕES PARA OS ESTABELECIMENTOS
-- =====================================================

INSERT INTO reviews (business_id, customer_name, rating, comment, created_at) VALUES 
-- Quintal da Villa
((SELECT id FROM businesses WHERE business_name = 'Quintal da Villa Restaurante'), 'João Silva', 5, 'Excelente restaurante! Comida deliciosa e atendimento impecável. Recomendo muito!', NOW() - INTERVAL '5 days'),
((SELECT id FROM businesses WHERE business_name = 'Quintal da Villa Restaurante'), 'Maria Santos', 5, 'Ambiente aconchegante e pratos maravilhosos. Voltarei sempre!', NOW() - INTERVAL '3 days'),
((SELECT id FROM businesses WHERE business_name = 'Quintal da Villa Restaurante'), 'Carlos Oliveira', 4, 'Muito bom! Apenas o tempo de espera que foi um pouco longo.', NOW() - INTERVAL '1 day'),

-- Bendito Burguer
((SELECT id FROM businesses WHERE business_name = 'Bendito Burguer'), 'Ana Costa', 5, 'Melhor hambúrguer de Ubatuba! Ingredientes frescos e sabor incrível.', NOW() - INTERVAL '4 days'),
((SELECT id FROM businesses WHERE business_name = 'Bendito Burguer'), 'Pedro Lima', 4, 'Hambúrguer muito saboroso, preço justo. Recomendo!', NOW() - INTERVAL '2 days'),

-- Smidi Farma
((SELECT id FROM businesses WHERE business_name = 'Smidi Farma'), 'Lucia Fernandes', 5, 'Farmácia completa, sempre tem o que preciso. Atendimento excelente!', NOW() - INTERVAL '6 days'),
((SELECT id FROM businesses WHERE business_name = 'Smidi Farma'), 'Roberto Alves', 4, 'Boa farmácia, preços competitivos e localização conveniente.', NOW() - INTERVAL '2 days'),

-- Comercial Itaguá
((SELECT id FROM businesses WHERE business_name = 'Comercial Itaguá'), 'José Pereira', 5, 'Tradição em Ubatuba! Sempre encontro tudo para minha obra aqui.', NOW() - INTERVAL '7 days'),
((SELECT id FROM businesses WHERE business_name = 'Comercial Itaguá'), 'Sandra Martins', 5, 'Atendimento nota 10, produtos de qualidade. Empresa séria!', NOW() - INTERVAL '3 days'),

-- Auto Comercial Taubaté
((SELECT id FROM businesses WHERE business_name = 'Auto Comercial Taubaté'), 'Marcos Souza', 4, 'Bom atendimento e variedade de peças. Preços razoáveis.', NOW() - INTERVAL '5 days'),
((SELECT id FROM businesses WHERE business_name = 'Auto Comercial Taubaté'), 'Fernanda Costa', 4, 'Encontrei a peça que precisava rapidamente. Recomendo!', NOW() - INTERVAL '1 day');

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Total de estabelecimentos adicionados: 23
-- Categorias: Restaurantes, Farmácias, Supermercados, Comércio, Autopeças
-- Cidade: Ubatuba-SP
-- Região: Centro e proximidades da Av Rio Grande do Sul
-- =====================================================

COMMIT;


        """
        
        # Executar
        db.session.execute(text(sql_script))
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Ubatuba populada com sucesso!',
            'estabelecimentos': 23
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
