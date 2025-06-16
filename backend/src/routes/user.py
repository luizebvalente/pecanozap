from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from src.models.user import db, User, Category, City, Review
from datetime import timedelta

user_bp = Blueprint('user', __name__)

# Configurar JWT
jwt = JWTManager()

@user_bp.route('/register', methods=['POST'])
def register():
    """Registro de novo estabelecimento"""
    try:
        data = request.get_json()
        
        # Verificar se email já existe
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar novo usuário
        user = User(
            email=data['email'],
            business_name=data['business_name'],
            owner_name=data['owner_name'],
            phone=data['phone'],
            whatsapp=data['whatsapp'],
            address=data['address'],
            description=data.get('description', ''),
            city_id=data['city_id'],
            category_id=data['category_id']
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'Estabelecimento cadastrado com sucesso!'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/login', methods=['POST'])
def login():
    """Login de estabelecimento"""
    try:
        data = request.get_json()
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            access_token = create_access_token(
                identity=user.id,
                expires_delta=timedelta(days=7)
            )
            return jsonify({
                'access_token': access_token,
                'user': user.to_dict()
            }), 200
        
        return jsonify({'error': 'Email ou senha inválidos'}), 401
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Obter perfil do usuário logado"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Atualizar perfil do usuário logado"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        user.business_name = data.get('business_name', user.business_name)
        user.owner_name = data.get('owner_name', user.owner_name)
        user.phone = data.get('phone', user.phone)
        user.whatsapp = data.get('whatsapp', user.whatsapp)
        user.address = data.get('address', user.address)
        user.description = data.get('description', user.description)
        user.city_id = data.get('city_id', user.city_id)
        user.category_id = data.get('category_id', user.category_id)
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        return jsonify({'message': 'Perfil atualizado com sucesso!'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/businesses', methods=['GET'])
def get_businesses():
    """Listar estabelecimentos com filtros"""
    try:
        city_id = request.args.get('city_id', type=int)
        category_id = request.args.get('category_id', type=int)
        search = request.args.get('search', '')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = User.query.filter_by(is_active=True)
        
        if city_id:
            query = query.filter_by(city_id=city_id)
        
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        if search:
            query = query.filter(
                User.business_name.contains(search) |
                User.description.contains(search)
            )
        
        businesses = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'businesses': [business.to_dict() for business in businesses.items],
            'total': businesses.total,
            'pages': businesses.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/businesses/<int:business_id>', methods=['GET'])
def get_business_detail(business_id):
    """Obter detalhes de um estabelecimento"""
    try:
        business = User.query.get(business_id)
        
        if not business or not business.is_active:
            return jsonify({'error': 'Estabelecimento não encontrado'}), 404
        
        # Incluir reviews aprovadas
        reviews = Review.query.filter_by(
            business_id=business_id, 
            is_approved=True
        ).order_by(Review.created_at.desc()).limit(10).all()
        
        business_data = business.to_dict()
        business_data['reviews'] = [review.to_dict() for review in reviews]
        business_data['city'] = business.city.to_dict()
        business_data['category'] = business.category.to_dict()
        
        return jsonify(business_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/categories', methods=['GET'])
def get_categories():
    """Listar categorias ativas"""
    try:
        categories = Category.query.filter_by(is_active=True).all()
        return jsonify([category.to_dict() for category in categories]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/cities', methods=['GET'])
def get_cities():
    """Listar cidades ativas"""
    try:
        cities = City.query.filter_by(is_active=True).order_by(City.name).all()
        return jsonify([city.to_dict() for city in cities]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@user_bp.route('/reviews', methods=['POST'])
def create_review():
    """Criar nova avaliação"""
    try:
        data = request.get_json()
        
        review = Review(
            customer_name=data['customer_name'],
            customer_phone=data.get('customer_phone', ''),
            rating=data['rating'],
            comment=data.get('comment', ''),
            business_id=data['business_id']
        )
        
        db.session.add(review)
        db.session.commit()
        
        return jsonify({'message': 'Avaliação enviada com sucesso!'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/reviews/<int:business_id>', methods=['GET'])
def get_business_reviews(business_id):
    """Obter avaliações de um estabelecimento"""
    try:
        reviews = Review.query.filter_by(
            business_id=business_id, 
            is_approved=True
        ).order_by(Review.created_at.desc()).all()
        
        return jsonify([review.to_dict() for review in reviews]), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

