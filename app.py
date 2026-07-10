"""
Living Kitchen 投票系统 - Flask Backend
"""
import sqlite3
import os
from functools import wraps
from flask import (
    Flask, render_template, request, jsonify, session, redirect, url_for, g
)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'living-kitchen-2026-vote-secret')
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'votes.db')

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')

CATEGORIES = ['凉菜', '热菜', '汤', '主食', '甜品']
CATEGORY_EMOJI = {
    '凉菜': '🥗', '热菜': '🔥', '汤': '🍲', '主食': '🍚', '甜品': '🍰'
}

def _cat_order(col='category'):
    """Return a SQL CASE expression for consistent category ordering."""
    parts = ' '.join(f"WHEN '{c}' THEN {i}" for i, c in enumerate(CATEGORIES))
    return f"CASE {col} {parts} ELSE 99 END"

# ──────────── Seed Data ────────────

SEED_DISHES = [
    # 凉菜
    ('羽衣甘蓝沙拉', '凉菜', '羽衣甘蓝、橙子、火龙果、牛油果、巴旦木、芝麻沙拉汁'),
    ('俄式土豆泥沙拉', '凉菜', '土豆、混和蔬菜粒、俄式酸黄瓜、鸡蛋、蛋黄酱、盐、黑胡椒'),
    ('金枪鱼黄芥末沙拉', '凉菜', '金枪鱼罐头、苦菊、鸡蛋、洋葱、圣女果、黄芥末酱、蜂蜜、橄榄油、黑胡椒、盐'),
    ('萨拉米奶酪', '凉菜', '萨拉米、布里奶酪、水果、坚果、蜂蜜、苏打饼干'),
    ('凉拌藕片', '凉菜', '藕、辣椒面、生抽、香菜、蒜、姜、孜然粉、咖喱粉、熟白芝麻、老抽、蚝油、白糖、醋'),
    ('凉拌菠菜', '凉菜', '菠菜、花生、辣椒面、生抽、香菜、蒜、姜、熟白芝麻、老抽、蚝油、白糖、醋'),
    ('芥末虾球', '凉菜', '菠萝、虾仁、鸡蛋、蛋黄酱、淀粉、山葵、盐'),
    ('黄瓜牛油果虾', '凉菜', '虾仁、黄瓜、牛油果、洋葱、柠檬汁、黑胡椒、盐'),
    ('蒜泥白肉', '凉菜', '五花肉、辣椒面、生抽、蒜、姜、葱、熟白芝麻、老抽、蚝油、白糖、醋'),
    ('越南春卷', '凉菜', '越南春卷皮、胡萝卜、紫甘蓝、黄瓜、蟹柳、虾仁、柠檬、生抽、香菜、糖'),
    # 热菜
    ('蒜香口蘑虾', '热菜', '口蘑、虾仁、蒜、生抽、鸡精、盐、欧芹碎'),
    ('黄油蛤蜊', '热菜', '蛤蜊、黄油、葱、姜、蒜、清酒'),
    ('黄咖喱牛肉', '热菜', '牛腩、土豆、洋葱、椰浆、黄咖喱酱、糖、盐'),
    ('眼肉牛排', '热菜', '眼肉牛排、迷迭香、橄榄油、黄油、蒜、黑胡椒、盐'),
    ('黑椒牛肉粒', '热菜', '菲力牛排、蒜、彩椒、鸡蛋、黑胡椒、黑胡椒酱、生抽、蚝油、料酒、盐'),
    ('洋葱炒肥牛', '热菜', '肥牛卷、洋葱、葱、姜、蒜、料酒、生抽、老抽、蚝油、淀粉、糖、盐、黑胡椒'),
    ('橙香鸡翅', '热菜', '鸡翅中、橙子、蒜、姜、生抽、老抽、蚝油、蜂蜜、黑胡椒'),
    ('蒜香鸡翅', '热菜', '鸡翅中、辣椒面、蒜、生抽、料酒、蚝油、蜂蜜、黑胡椒、盐'),
    ('可乐鸡翅', '热菜', '鸡翅中、可乐、料酒、姜、葱、生抽、老抽'),
    ('奥尔良鸡翅', '热菜', '鸡翅中、奥尔良粉、生抽'),
    ('椰香鸡肉烩南瓜', '热菜', '鸡腿肉、老南瓜、菠菜、椰奶、姜黄粉、糖、盐'),
    ('摩洛哥风味香梨鸡', '热菜', '鸡腿肉、梨、洋葱、蒜、姜、香菜、姜黄粉、红甜椒粉、肉桂粉、孜然粉、杏仁、黑胡椒、盐'),
    ('迷迭香嫩煎鸡', '热菜', '鸡胸肉、洋葱、迷迭香、吐司、蒜、蜂蜜、白葡萄酒、黑胡椒、盐'),
    ('奶油蘑菇鸡', '热菜', '鸡腿肉、口蘑、淡奶油、蒜、洋葱、黑胡椒、盐、欧芹碎'),
    ('蒜香烤排骨', '热菜', '排骨、辣椒面、蒜、生抽、姜、蚝油、蜂蜜、黑胡椒、盐'),
    ('粉蒸肉', '热菜', '梅花肉、五花肉、红薯、蒸肉粉、葱、姜、老抽、生抽、蚝油、豆瓣酱'),
    ('苹果猪排', '热菜', '猪梅花肉、苹果、洋葱、蒜、肉桂粉、红糖、生抽、老抽、蚝油、白葡萄酒、黄油、黑胡椒、盐'),
    ('柠檬蜂蜜三文鱼', '热菜', '三文鱼、柠檬、蒜、蜂蜜、小番茄、黄油、黑胡椒、盐'),
    ('韩式炒鱿鱼年糕', '热菜', '鱿鱼须、年糕、洋葱、蒜、青红椒、韩式辣酱、蒜蓉辣酱、蜂蜜、蚝油、生抽、辣椒粉、盐'),
    ('咸蛋黄蒜香烤南瓜', '热菜', '贝贝南瓜、咸蛋黄、蒜、面粉、黑胡椒、盐'),
    ('鱼香杏鲍菇', '热菜', '杏鲍菇、胡萝卜、木耳、青椒、葱、蒜、豆瓣酱、生抽、醋、蚝油、糖、淀粉'),
    ('西班牙炖菜', '热菜', '西红柿、茄子、彩椒、西葫芦、蒜、洋葱、黑胡椒'),
    ('白灼生菜', '热菜', '生菜、蒜、生抽、香油、蚝油、糖'),
    # 汤
    ('奶油南瓜汤', '汤', '老南瓜、黄洋葱、黄油、盐、黑胡椒、橄榄油、淡奶油'),
    ('冬瓜丸子汤', '汤', '猪肉馅、冬瓜、葱、姜、香菜、白胡椒粉、生抽、淀粉、盐'),
    # 主食
    ('韩式泡菜饼', '主食', '泡菜、鱿鱼、大葱、辣椒粉、面粉、盐'),
    ('海鲜时蔬饼', '主食', '虾仁、鱿鱼、韭菜、洋葱、混合蔬菜粒、彩椒、面粉、鸡蛋、淀粉、黑胡椒、盐'),
    ('紫菜包饭', '主食', '米饭、紫菜、黄萝卜、肉松、火腿肠、鸡蛋、黄瓜、白醋'),
    ('菠萝炒饭', '主食', '米饭、菠萝、鸡蛋、虾仁、洋葱、混和蔬菜、鱼露、咖喱粉、盐'),
    ('奶油虾意面', '主食', '洋葱、蒜、虾仁、黄油、淡奶油、意面、蕃茄膏'),
    ('肉酱意面', '主食', '意面、牛肉馅、洋葱、番茄罗勒酱、盐'),
    ('肉酱千层意面', '主食', '千层意面、牛肉馅、洋葱、意面白酱、番茄罗勒酱、马苏里拉芝士、盐'),
    ('饺子', '主食', '可选口味：猪肉白菜、猪肉芹菜、猪肉韭菜、牛肉豆角、牛肉大葱、羊肉胡萝卜、羊肉茴香、韭菜鸡蛋'),
    ('焦香海鲜披萨', '主食', '虾仁、蟹柳、蔬菜粒、番茄罗勒酱、马苏里拉芝士'),
    ('黑椒牛肉披萨', '主食', '牛肉、黑椒酱、洋葱、生抽、黑胡椒、番茄罗勒酱、马苏里拉芝士'),
    ('夏威夷风情披萨', '主食', '菠萝、火腿、番茄罗勒酱、马苏里拉芝士'),
    ('培根洋葱披萨', '主食', '培根、洋葱、番茄罗勒酱、马苏里拉芝士'),
    ('奥尔良鸡肉披萨', '主食', '鸡腿肉、奥尔良粉、蔬菜粒、番茄罗勒酱、马苏里拉芝士'),
    ('田园荟萃披萨', '主食', '蘑菇、洋葱、蔬菜粒、圣女果、番茄罗勒酱、马苏里拉芝士'),
    ('缤纷水果披萨', '主食', '黄桃、菠萝、蓝莓果酱、马苏里拉芝士'),
    # 甜品
    ('纸杯蛋糕', '甜品', '鸡蛋、奶油、低筋面粉、玉米油、糖、牛奶'),
    ('蓝莓麦芬蛋糕', '甜品', '鸡蛋、牛奶、蓝莓、低筋面粉、玉米油、糖、泡打粉'),
    ('桂花乌龙椰奶冻', '甜品', '椰汁、乌龙茶、桂花蜜、吉利丁、糖'),
    ('芝士焗红薯', '甜品', '红薯、芝士、糖、淡奶油'),
    ('蔓越莓饼干', '甜品', '黄油、低筋面粉、蔓越莓干、鸡蛋、奶粉、糖粉'),
    ('伯爵茶饼干', '甜品', '黄油、低筋面粉、伯爵红茶碎、鸡蛋、奶粉、糖粉'),
    ('迷你糖葫芦', '甜品', '山楂、蓝莓/橘子/青提、糖'),
    ('卡通饼干', '甜品', '黄油、低筋面粉、鸡蛋、奶粉、糖粉'),
    ('牛轧糖', '甜品', '棉花糖、花生碎、黑芝麻、黄油、奶粉'),
    ('雪花酥', '甜品', '棉花糖、饼干、混合坚果、黄油、奶粉'),
    ('西多士', '甜品', '吐司、鸡蛋、牛奶、淡奶油、炼乳、黄油、水果'),
    ('樱花山药糕', '甜品', '山药、火龙果、糯米粉、奶粉/炼乳、糖、桂花酱'),
    ('蓝莓山药', '甜品', '山药、蓝莓酱、蓝莓、牛奶、胡萝卜'),
    ('玫瑰奶茶', '甜品', '牛奶、红茶、玫瑰花、桂花、糖'),
    ('酒酿圆子', '甜品', '糯米小圆子、酒酿、枸杞、糖'),
]

# ──────────── Database ────────────

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            ingredients TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_name TEXT NOT NULL,
            dish_id INTEGER NOT NULL,
            vote_type TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dish_id) REFERENCES dishes(id)
        )
    """)
    conn.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dish
        ON votes(user_name, dish_id)
    """)
    # Seed dishes if table is empty
    cursor = conn.execute("SELECT COUNT(*) FROM dishes")
    if cursor.fetchone()[0] == 0:
        conn.executemany(
            "INSERT INTO dishes (name, category, ingredients) VALUES (?, ?, ?)",
            SEED_DISHES
        )
        conn.commit()
    conn.close()

# ──────────── Helpers ────────────

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('admin'):
            return jsonify({'error': '未登录管理员'}), 401
        return f(*args, **kwargs)
    return decorated

# ──────────── Pages ────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin_page():
    if not session.get('admin'):
        return redirect(url_for('admin_login_page'))
    return render_template('admin.html')

@app.route('/admin/login')
def admin_login_page():
    if session.get('admin'):
        return redirect(url_for('admin_page'))
    return render_template('admin.html', login_only=True)

# ──────────── API: Dishes ────────────

@app.route('/api/dishes')
def get_dishes():
    db = get_db()
    dishes = db.execute(f"SELECT * FROM dishes ORDER BY {_cat_order()}, id").fetchall()
    result = []
    for d in dishes:
        result.append({
            'id': d['id'],
            'name': d['name'],
            'category': d['category'],
            'ingredients': d['ingredients'],
            'emoji': CATEGORY_EMOJI.get(d['category'], '🍽')
        })
    return jsonify(result)

@app.route('/api/dishes/remaining')
def get_remaining_dishes():
    """Get dishes the user hasn't voted on yet."""
    user_name = request.args.get('user', '').strip()
    if not user_name:
        return jsonify({'error': '缺少用户名'}), 400
    db = get_db()
    voted_ids = [
        r['dish_id'] for r in
        db.execute("SELECT dish_id FROM votes WHERE user_name = ?", (user_name,)).fetchall()
    ]
    if voted_ids:
        placeholders = ','.join('?' * len(voted_ids))
        dishes = db.execute(
            f"SELECT * FROM dishes WHERE id NOT IN ({placeholders}) ORDER BY {_cat_order()}, id",
            voted_ids
        ).fetchall()
    else:
        dishes = db.execute(f"SELECT * FROM dishes ORDER BY {_cat_order()}, id").fetchall()

    result = []
    for d in dishes:
        result.append({
            'id': d['id'],
            'name': d['name'],
            'category': d['category'],
            'ingredients': d['ingredients'],
            'emoji': CATEGORY_EMOJI.get(d['category'], '🍽')
        })
    return jsonify(result)

@app.route('/api/my-votes')
def get_my_votes():
    """Get the current user's votes."""
    user_name = request.args.get('user', '').strip()
    if not user_name:
        return jsonify({'error': '缺少用户名'}), 400
    db = get_db()
    votes = db.execute(
        "SELECT dish_id, vote_type FROM votes WHERE user_name = ?", (user_name,)
    ).fetchall()
    return jsonify([{'dish_id': v['dish_id'], 'vote_type': v['vote_type']} for v in votes])

# ──────────── API: Votes ────────────

@app.route('/api/vote', methods=['POST'])
def submit_vote():
    data = request.json
    user_name = (data.get('user') or '').strip()
    dish_id = data.get('dish_id')
    vote_type = data.get('vote_type')

    if not user_name:
        return jsonify({'error': '请输入昵称'}), 400
    if not dish_id:
        return jsonify({'error': '缺少菜品'}), 400
    if vote_type not in ('like', 'dislike', 'no_idea'):
        return jsonify({'error': '无效的投票类型'}), 400

    db = get_db()
    # Check dish exists
    dish = db.execute("SELECT id FROM dishes WHERE id = ?", (dish_id,)).fetchone()
    if not dish:
        return jsonify({'error': '菜品不存在'}), 404

    # Upsert vote
    db.execute(
        "DELETE FROM votes WHERE user_name = ? AND dish_id = ?",
        (user_name, dish_id)
    )
    db.execute(
        "INSERT INTO votes (user_name, dish_id, vote_type) VALUES (?, ?, ?)",
        (user_name, dish_id, vote_type)
    )
    db.commit()
    return jsonify({'ok': True})

# ──────────── API: Results ────────────

@app.route('/api/results')
def get_results():
    db = get_db()
    dishes = db.execute(f"SELECT * FROM dishes ORDER BY {_cat_order()}, id").fetchall()
    result = []
    for d in dishes:
        likes = db.execute(
            "SELECT COUNT(*) as c FROM votes WHERE dish_id=? AND vote_type='like'", (d['id'],)
        ).fetchone()['c']
        dislikes = db.execute(
            "SELECT COUNT(*) as c FROM votes WHERE dish_id=? AND vote_type='dislike'", (d['id'],)
        ).fetchone()['c']
        no_ideas = db.execute(
            "SELECT COUNT(*) as c FROM votes WHERE dish_id=? AND vote_type='no_idea'", (d['id'],)
        ).fetchone()['c']
        result.append({
            'id': d['id'],
            'name': d['name'],
            'category': d['category'],
            'ingredients': d['ingredients'],
            'emoji': CATEGORY_EMOJI.get(d['category'], '🍽'),
            'likes': likes,
            'dislikes': dislikes,
            'no_ideas': no_ideas,
            'total': likes + dislikes + no_ideas
        })
    # Sort by likes descending within each category
    result.sort(key=lambda x: (CATEGORIES.index(x['category']) if x['category'] in CATEGORIES else 99, -x['likes']))
    return jsonify(result)

@app.route('/api/stats')
def get_stats():
    db = get_db()
    total_dishes = db.execute("SELECT COUNT(*) as c FROM dishes").fetchone()['c']
    total_votes = db.execute("SELECT COUNT(*) as c FROM votes").fetchone()['c']
    total_users = db.execute("SELECT COUNT(DISTINCT user_name) as c FROM votes").fetchone()['c']
    return jsonify({
        'total_dishes': total_dishes,
        'total_votes': total_votes,
        'total_users': total_users
    })

# ──────────── API: Admin ────────────

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    password = data.get('password', '')
    if password == ADMIN_PASSWORD:
        session['admin'] = True
        return jsonify({'ok': True})
    return jsonify({'error': '密码错误'}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin', None)
    return jsonify({'ok': True})

@app.route('/api/admin/check')
def admin_check():
    return jsonify({'admin': bool(session.get('admin'))})

@app.route('/api/admin/dishes', methods=['POST'])
@admin_required
def add_dish():
    data = request.json
    name = (data.get('name') or '').strip()
    category = (data.get('category') or '').strip()
    ingredients = (data.get('ingredients') or '').strip()
    if not name or not category or not ingredients:
        return jsonify({'error': '请填写完整信息'}), 400
    if category not in CATEGORIES:
        return jsonify({'error': f'分类必须是: {", ".join(CATEGORIES)}'}), 400
    db = get_db()
    cursor = db.execute(
        "INSERT INTO dishes (name, category, ingredients) VALUES (?, ?, ?)",
        (name, category, ingredients)
    )
    db.commit()
    return jsonify({'ok': True, 'id': cursor.lastrowid})

@app.route('/api/admin/dishes/<int:dish_id>', methods=['PUT'])
@admin_required
def update_dish(dish_id):
    data = request.json
    name = (data.get('name') or '').strip()
    category = (data.get('category') or '').strip()
    ingredients = (data.get('ingredients') or '').strip()
    if not name or not category or not ingredients:
        return jsonify({'error': '请填写完整信息'}), 400
    db = get_db()
    db.execute(
        "UPDATE dishes SET name=?, category=?, ingredients=? WHERE id=?",
        (name, category, ingredients, dish_id)
    )
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/dishes/<int:dish_id>', methods=['DELETE'])
@admin_required
def delete_dish(dish_id):
    db = get_db()
    db.execute("DELETE FROM votes WHERE dish_id = ?", (dish_id,))
    db.execute("DELETE FROM dishes WHERE id = ?", (dish_id,))
    db.commit()
    return jsonify({'ok': True})

@app.route('/api/admin/reset-votes', methods=['POST'])
@admin_required
def reset_votes():
    db = get_db()
    db.execute("DELETE FROM votes")
    db.commit()
    return jsonify({'ok': True})

# ──────────── Main ────────────

if __name__ == '__main__':
    init_db()
    print("=" * 50)
    print("  Living Kitchen 投票系统已启动")
    print("  访问地址: http://localhost:5000")
    print("  管理后台: http://localhost:5000/admin")
    print(f"  管理员密码: {ADMIN_PASSWORD}")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
