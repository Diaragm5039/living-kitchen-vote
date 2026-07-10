/**
 * Living Kitchen Vote System - Node.js + Express + Supabase PostgreSQL
 */
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const path = require('path');

const app = express();

// ── Config ──
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'living-kitchen-2026';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL is not set.');
  console.error('  Set it via: export DATABASE_URL=postgresql://...');
  console.error('  Or create a .env file (see .env.example)');
  process.exit(1);
}

// ── Database ──
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : false,
});

// ── Middleware ──
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.locals.isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  next();
});
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}));

// ── Static files ──
app.use(express.static(path.join(__dirname, 'templates')));

// ── Category constants ──
const CATEGORIES = ['凉菜', '热菜', '汤', '主食', '甜品'];
const CATEGORY_EMOJI = {
  '凉菜': '🥗', '热菜': '🔥', '汤': '🍲', '主食': '🍚', '甜品': '🍰',
};

function catOrderSQL(col = 'category') {
  const parts = CATEGORIES.map((c, i) => `WHEN '${c}' THEN ${i}`).join(' ');
  return `CASE ${col} ${parts} ELSE 99 END`;
}

function addEmoji(dish) {
  return { ...dish, emoji: CATEGORY_EMOJI[dish.category] || '🍽' };
}

// ── Seed data ──
const SEED_DISHES = [
  ['羽衣甘蓝沙拉','凉菜','羽衣甘蓝、橙子、火龙果、牛油果、巴旦木、芝麻沙拉汁'],
  ['俄式土豆泥沙拉','凉菜','土豆、混和蔬菜粒、俄式酸黄瓜、鸡蛋、蛋黄酱、盐、黑胡椒'],
  ['金枪鱼黄芥末沙拉','凉菜','金枪鱼罐头、苦菊、鸡蛋、洋葱、圣女果、黄芥末酱、蜂蜜、橄榄油、黑胡椒、盐'],
  ['萨拉米奶酪','凉菜','萨拉米、布里奶酪、水果、坚果、蜂蜜、苏打饼干'],
  ['凉拌藕片','凉菜','藕、辣椒面、生抽、香菜、蒜、姜、孜然粉、咖喱粉、熟白芝麻、老抽、蚝油、白糖、醋'],
  ['凉拌菠菜','凉菜','菠菜、花生、辣椒面、生抽、香菜、蒜、姜、熟白芝麻、老抽、蚝油、白糖、醋'],
  ['芥末虾球','凉菜','菠萝、虾仁、鸡蛋、蛋黄酱、淀粉、山葵、盐'],
  ['黄瓜牛油果虾','凉菜','虾仁、黄瓜、牛油果、洋葱、柠檬汁、黑胡椒、盐'],
  ['蒜泥白肉','凉菜','五花肉、辣椒面、生抽、蒜、姜、葱、熟白芝麻、老抽、蚝油、白糖、醋'],
  ['越南春卷','凉菜','越南春卷皮、胡萝卜、紫甘蓝、黄瓜、蟹柳、虾仁、柠檬、生抽、香菜、糖'],
  ['蒜香口蘑虾','热菜','口蘑、虾仁、蒜、生抽、鸡精、盐、欧芹碎'],
  ['黄油蛤蜊','热菜','蛤蜊、黄油、葱、姜、蒜、清酒'],
  ['黄咖喱牛肉','热菜','牛腩、土豆、洋葱、椰浆、黄咖喱酱、糖、盐'],
  ['眼肉牛排','热菜','眼肉牛排、迷迭香、橄榄油、黄油、蒜、黑胡椒、盐'],
  ['黑椒牛肉粒','热菜','菲力牛排、蒜、彩椒、鸡蛋、黑胡椒、黑胡椒酱、生抽、蚝油、料酒、盐'],
  ['洋葱炒肥牛','热菜','肥牛卷、洋葱、葱、姜、蒜、料酒、生抽、老抽、蚝油、淀粉、糖、盐、黑胡椒'],
  ['橙香鸡翅','热菜','鸡翅中、橙子、蒜、姜、生抽、老抽、蚝油、蜂蜜、黑胡椒'],
  ['蒜香鸡翅','热菜','鸡翅中、辣椒面、蒜、生抽、料酒、蚝油、蜂蜜、黑胡椒、盐'],
  ['可乐鸡翅','热菜','鸡翅中、可乐、料酒、姜、葱、生抽、老抽'],
  ['奥尔良鸡翅','热菜','鸡翅中、奥尔良粉、生抽'],
  ['椰香鸡肉烩南瓜','热菜','鸡腿肉、老南瓜、菠菜、椰奶、姜黄粉、糖、盐'],
  ['摩洛哥风味香梨鸡','热菜','鸡腿肉、梨、洋葱、蒜、姜、香菜、姜黄粉、红甜椒粉、肉桂粉、孜然粉、杏仁、黑胡椒、盐'],
  ['迷迭香嫩煎鸡','热菜','鸡胸肉、洋葱、迷迭香、吐司、蒜、蜂蜜、白葡萄酒、黑胡椒、盐'],
  ['奶油蘑菇鸡','热菜','鸡腿肉、口蘑、淡奶油、蒜、洋葱、黑胡椒、盐、欧芹碎'],
  ['蒜香烤排骨','热菜','排骨、辣椒面、蒜、生抽、姜、蚝油、蜂蜜、黑胡椒、盐'],
  ['粉蒸肉','热菜','梅花肉、五花肉、红薯、蒸肉粉、葱、姜、老抽、生抽、蚝油、豆瓣酱'],
  ['苹果猪排','热菜','猪梅花肉、苹果、洋葱、蒜、肉桂粉、红糖、生抽、老抽、蚝油、白葡萄酒、黄油、黑胡椒、盐'],
  ['柠檬蜂蜜三文鱼','热菜','三文鱼、柠檬、蒜、蜂蜜、小番茄、黄油、黑胡椒、盐'],
  ['韩式炒鱿鱼年糕','热菜','鱿鱼须、年糕、洋葱、蒜、青红椒、韩式辣酱、蒜蓉辣酱、蜂蜜、蚝油、生抽、辣椒粉、盐'],
  ['咸蛋黄蒜香烤南瓜','热菜','贝贝南瓜、咸蛋黄、蒜、面粉、黑胡椒、盐'],
  ['鱼香杏鲍菇','热菜','杏鲍菇、胡萝卜、木耳、青椒、葱、蒜、豆瓣酱、生抽、醋、蚝油、糖、淀粉'],
  ['西班牙炖菜','热菜','西红柿、茄子、彩椒、西葫芦、蒜、洋葱、黑胡椒'],
  ['白灼生菜','热菜','生菜、蒜、生抽、香油、蚝油、糖'],
  ['奶油南瓜汤','汤','老南瓜、黄洋葱、黄油、盐、黑胡椒、橄榄油、淡奶油'],
  ['冬瓜丸子汤','汤','猪肉馅、冬瓜、葱、姜、香菜、白胡椒粉、生抽、淀粉、盐'],
  ['韩式泡菜饼','主食','泡菜、鱿鱼、大葱、辣椒粉、面粉、盐'],
  ['海鲜时蔬饼','主食','虾仁、鱿鱼、韭菜、洋葱、混合蔬菜粒、彩椒、面粉、鸡蛋、淀粉、黑胡椒、盐'],
  ['紫菜包饭','主食','米饭、紫菜、黄萝卜、肉松、火腿肠、鸡蛋、黄瓜、白醋'],
  ['菠萝炒饭','主食','米饭、菠萝、鸡蛋、虾仁、洋葱、混和蔬菜、鱼露、咖喱粉、盐'],
  ['奶油虾意面','主食','洋葱、蒜、虾仁、黄油、淡奶油、意面、蕃茄膏'],
  ['肉酱意面','主食','意面、牛肉馅、洋葱、番茄罗勒酱、盐'],
  ['肉酱千层意面','主食','千层意面、牛肉馅、洋葱、意面白酱、番茄罗勒酱、马苏里拉芝士、盐'],
  ['饺子','主食','可选口味：猪肉白菜、猪肉芹菜、猪肉韭菜、牛肉豆角、牛肉大葱、羊肉胡萝卜、羊肉茴香、韭菜鸡蛋'],
  ['焦香海鲜披萨','主食','虾仁、蟹柳、蔬菜粒、番茄罗勒酱、马苏里拉芝士'],
  ['黑椒牛肉披萨','主食','牛肉、黑椒酱、洋葱、生抽、黑胡椒、番茄罗勒酱、马苏里拉芝士'],
  ['夏威夷风情披萨','主食','菠萝、火腿、番茄罗勒酱、马苏里拉芝士'],
  ['培根洋葱披萨','主食','培根、洋葱、番茄罗勒酱、马苏里拉芝士'],
  ['奥尔良鸡肉披萨','主食','鸡腿肉、奥尔良粉、蔬菜粒、番茄罗勒酱、马苏里拉芝士'],
  ['田园荟萃披萨','主食','蘑菇、洋葱、蔬菜粒、圣女果、番茄罗勒酱、马苏里拉芝士'],
  ['缤纷水果披萨','主食','黄桃、菠萝、蓝莓果酱、马苏里拉芝士'],
  ['纸杯蛋糕','甜品','鸡蛋、奶油、低筋面粉、玉米油、糖、牛奶'],
  ['蓝莓麦芬蛋糕','甜品','鸡蛋、牛奶、蓝莓、低筋面粉、玉米油、糖、泡打粉'],
  ['桂花乌龙椰奶冻','甜品','椰汁、乌龙茶、桂花蜜、吉利丁、糖'],
  ['芝士焗红薯','甜品','红薯、芝士、糖、淡奶油'],
  ['蔓越莓饼干','甜品','黄油、低筋面粉、蔓越莓干、鸡蛋、奶粉、糖粉'],
  ['伯爵茶饼干','甜品','黄油、低筋面粉、伯爵红茶碎、鸡蛋、奶粉、糖粉'],
  ['迷你糖葫芦','甜品','山楂、蓝莓/橘子/青提、糖'],
  ['卡通饼干','甜品','黄油、低筋面粉、鸡蛋、奶粉、糖粉'],
  ['牛轧糖','甜品','棉花糖、花生碎、黑芝麻、黄油、奶粉'],
  ['雪花酥','甜品','棉花糖、饼干、混合坚果、黄油、奶粉'],
  ['西多士','甜品','吐司、鸡蛋、牛奶、淡奶油、炼乳、黄油、水果'],
  ['樱花山药糕','甜品','山药、火龙果、糯米粉、奶粉/炼乳、糖、桂花酱'],
  ['蓝莓山药','甜品','山药、蓝莓酱、蓝莓、牛奶、胡萝卜'],
  ['玫瑰奶茶','甜品','牛奶、红茶、玫瑰花、桂花、糖'],
  ['酒酿圆子','甜品','糯米小圆子、酒酿、枸杞、糖'],
];

async function seedDishes() {
  const { rows } = await pool.query('SELECT COUNT(*) as c FROM dishes');
  if (parseInt(rows[0].c) === 0) {
    for (const [name, category, ingredients] of SEED_DISHES) {
      await pool.query(
        'INSERT INTO dishes (name, category, ingredients) VALUES ($1, $2, $3)',
        [name, category, ingredients]
      );
    }
    console.log(`  Seeded ${SEED_DISHES.length} dishes`);
  }
}

// ── Helpers ──
function requireAdmin(req, res, next) {
  if (!req.session?.admin) {
    return res.status(401).json({ error: '未登录管理员' });
  }
  next();
}

// ════════════════════════════════════════════
//  API: Dishes
// ════════════════════════════════════════════

app.get('/api/dishes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM dishes ORDER BY ${catOrderSQL()}, id`
    );
    res.json(rows.map(addEmoji));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/dishes/remaining', async (req, res) => {
  try {
    const user = (req.query.user || '').trim();
    if (!user) return res.status(400).json({ error: '缺少用户名' });

    const voted = await pool.query(
      'SELECT dish_id FROM votes WHERE user_name = $1', [user]
    );
    const votedIds = voted.rows.map(r => r.dish_id);

    let rows;
    if (votedIds.length > 0) {
      const placeholders = votedIds.map((_, i) => `$${i + 1}`).join(',');
      const result = await pool.query(
        `SELECT * FROM dishes WHERE id NOT IN (${placeholders}) ORDER BY ${catOrderSQL()}, id`,
        votedIds
      );
      rows = result.rows;
    } else {
      const result = await pool.query(
        `SELECT * FROM dishes ORDER BY ${catOrderSQL()}, id`
      );
      rows = result.rows;
    }
    res.json(rows.map(addEmoji));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/my-votes', async (req, res) => {
  try {
    const user = (req.query.user || '').trim();
    if (!user) return res.status(400).json({ error: '缺少用户名' });
    const { rows } = await pool.query(
      'SELECT dish_id, vote_type FROM votes WHERE user_name = $1', [user]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════
//  API: Votes
// ════════════════════════════════════════════

app.post('/api/vote', async (req, res) => {
  try {
    const { user, dish_id, vote_type } = req.body;
    const userName = (user || '').trim();
    if (!userName) return res.status(400).json({ error: '请输入昵称' });
    if (!dish_id) return res.status(400).json({ error: '缺少菜品' });
    if (!['accept', 'dislike'].includes(vote_type))
      return res.status(400).json({ error: '无效的投票类型' });

    const dish = await pool.query('SELECT id FROM dishes WHERE id = $1', [dish_id]);
    if (dish.rows.length === 0) return res.status(404).json({ error: '菜品不存在' });

    await pool.query(
      `INSERT INTO votes (user_name, dish_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_name, dish_id)
       DO UPDATE SET vote_type = $3, created_at = CURRENT_TIMESTAMP`,
      [userName, dish_id, vote_type]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════
//  API: Results
// ════════════════════════════════════════════

app.get('/api/results', async (req, res) => {
  try {
    const { rows: dishes } = await pool.query(
      `SELECT * FROM dishes ORDER BY ${catOrderSQL()}, id`
    );
    const results = [];
    for (const d of dishes) {
      const accepts = await pool.query(
        "SELECT COUNT(*) as c FROM votes WHERE dish_id=$1 AND vote_type='accept'", [d.id]
      );
      const dislikes = await pool.query(
        "SELECT COUNT(*) as c FROM votes WHERE dish_id=$1 AND vote_type='dislike'", [d.id]
      );
      const a = parseInt(accepts.rows[0].c);
      const dl = parseInt(dislikes.rows[0].c);
      results.push({ ...addEmoji(d), accepts: a, dislikes: dl, total: a + dl });
    }
    results.sort((a, b) => {
      const ai = CATEGORIES.indexOf(a.category);
      const bi = CATEGORIES.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || b.accepts - a.accepts;
    });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [dishes, votes, users] = await Promise.all([
      pool.query('SELECT COUNT(*) as c FROM dishes'),
      pool.query('SELECT COUNT(*) as c FROM votes'),
      pool.query('SELECT COUNT(DISTINCT user_name) as c FROM votes'),
    ]);
    res.json({
      total_dishes: parseInt(dishes.rows[0].c),
      total_votes: parseInt(votes.rows[0].c),
      total_users: parseInt(users.rows[0].c),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════
//  API: Admin
// ════════════════════════════════════════════

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.admin = true;
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/admin/check', (req, res) => {
  res.json({ admin: !!req.session?.admin });
});

app.post('/api/admin/dishes', requireAdmin, async (req, res) => {
  try {
    const { name, category, ingredients } = req.body;
    if (!name?.trim() || !category?.trim() || !ingredients?.trim())
      return res.status(400).json({ error: '请填写完整信息' });
    if (!CATEGORIES.includes(category))
      return res.status(400).json({ error: `分类必须是: ${CATEGORIES.join(', ')}` });

    const result = await pool.query(
      'INSERT INTO dishes (name, category, ingredients) VALUES ($1, $2, $3) RETURNING id',
      [name.trim(), category, ingredients.trim()]
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/dishes/:id', requireAdmin, async (req, res) => {
  try {
    const { name, category, ingredients } = req.body;
    if (!name?.trim() || !category?.trim() || !ingredients?.trim())
      return res.status(400).json({ error: '请填写完整信息' });

    await pool.query(
      'UPDATE dishes SET name=$1, category=$2, ingredients=$3 WHERE id=$4',
      [name.trim(), category, ingredients.trim(), req.params.id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/dishes/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM votes WHERE dish_id = $1', [req.params.id]);
    await pool.query('DELETE FROM dishes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/reset-votes', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM votes');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ════════════════════════════════════════════
//  Page routes
// ════════════════════════════════════════════

app.get('/admin', (req, res) => {
  if (!req.session?.admin) return res.redirect('/admin-login');
  res.sendFile(path.join(__dirname, 'templates', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
  if (req.session?.admin) return res.redirect('/admin');
  res.sendFile(path.join(__dirname, 'templates', 'admin-login.html'));
});

// ════════════════════════════════════════════
//  Start
// ════════════════════════════════════════════

async function main() {
  try {
    await pool.query('SELECT 1');
    console.log('  Database connected');
    await seedDishes();
  } catch (e) {
    console.error('  Database error:', e.message);
  }

  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('  Living Kitchen Vote System');
    console.log(`  Local:   http://localhost:${PORT}`);
    console.log(`  Admin:   http://localhost:${PORT}/admin`);
    console.log(`  Pass:    ${ADMIN_PASSWORD}`);
    console.log('='.repeat(50));
  });
}

main();
