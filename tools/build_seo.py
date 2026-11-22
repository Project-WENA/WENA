#!/usr/bin/env python3
"""WENA site SEO builder.

  python3 tools/build_seo.py          -> static blog pages (blog/<slug>.html), blog list, sitemap.xml
  python3 tools/build_seo.py --pages  -> also rewrites the SEO <head> block of the main pages

The GitHub Action (.github/workflows/build-blog.yml) runs the first form whenever a
blog post changes, so new posts get their own indexable page automatically.
"""
import warnings; warnings.filterwarnings('ignore', category=DeprecationWarning)
import datetime as dt, html, json, os, re, sys, urllib.parse
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://wena.co.in'
OG_IMAGE = SITE + '/assets/og-image.jpg'
LOGO = SITE + '/assets/logo-360.png'
ADSENSE = ('<meta name="google-adsense-account" content="ca-pub-2129249319707125">\n'
           '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2129249319707125" crossorigin="anonymous"></script>')
FULL = 'Wellness Education Network & Alliance'
SAME_AS = ['https://www.linkedin.com/company/wena-india/', 'https://www.instagram.com/wena_india/',
           'https://www.facebook.com/profile.php?id=61562936061893', 'https://in.pinterest.com/reachoutwena/',
           'https://www.youtube.com/@nituforwena']
ORG_REF = {'@id': SITE + '/#organization'}
START, END = '<!-- SEO:START -->', '<!-- SEO:END -->'

ORG = {
    '@type': ['Organization', 'EducationalOrganization'], '@id': SITE + '/#organization',
    'name': 'WENA', 'legalName': 'WENA', 'alternateName': [f'WENA - {FULL}', FULL],
    'url': SITE + '/', 'logo': LOGO, 'image': OG_IMAGE,
    'slogan': 'Spreading Financial Wellness across India',
    'description': 'WENA runs sponsored educational financial awareness sessions and programs for students, employees, business owners, retirees, communities and families across India.',
    'email': 'reachout@wena.co.in', 'telephone': '+91-9599299830',
    'address': {'@type': 'PostalAddress', 'streetAddress': '207, C2 Building, Plot 14, Sector 22, Dwarka',
                'addressLocality': 'New Delhi', 'postalCode': '110075', 'addressRegion': 'Delhi', 'addressCountry': 'IN'},
    'areaServed': {'@type': 'Country', 'name': 'India'},
    'foundingDate': '2024',
    'founder': {'@id': SITE + '/#founder'},
    'contactPoint': {'@type': 'ContactPoint', 'contactType': 'customer service', 'email': 'reachout@wena.co.in',
                     'telephone': '+91-9599299830', 'areaServed': 'IN', 'availableLanguage': ['English', 'Hindi']},
    'sameAs': SAME_AS,
}
FOUNDER = {'@type': 'Person', '@id': SITE + '/#founder', 'name': 'Nitu Sharma', 'jobTitle': 'Founder & CEO',
           'worksFor': ORG_REF, 'url': SITE + '/#founder',
           'sameAs': ['https://www.linkedin.com/in/nitusharmamarketing/']}
BOOK = {'@type': 'Book', 'name': "Start Small, Grow Big: Fintara's Financial Journey", 'author': {'@id': SITE + '/#founder'},
        'url': 'https://link.amazon/B0fM0Pn8Q'}
WEBSITE = {'@type': 'WebSite', '@id': SITE + '/#website', 'url': SITE + '/', 'name': 'WENA',
           'alternateName': FULL, 'publisher': ORG_REF, 'inLanguage': 'en-IN'}

PROGRAMS = [('students', 'Student Financial Wellness', 'Final-year college students'),
            ('employees', 'Employee Financial Wellness', 'Corporate & IT teams, frontline workforce, teachers & school staff'),
            ('business-owners', 'Business Owner Financial Wellness', 'MSME owners, founders, self-employed professionals & gig workers'),
            ('retirees', 'Retiree Financial Wellness', 'Pre-retirees, retirees & senior citizens'),
            ('communities', 'Community Financial Wellness', 'NGOs, SHGs, resident groups & homemakers'),
            ('individuals', 'Financial Wellness for Individuals & Families', 'Individuals and families planning their finances')]


def crumbs(*items):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


PAGES = {
    'index.html': dict(
        path='/', title='WENA | Financial Wellness Sessions & Programs across India',
        desc='WENA (Wellness Education Network & Alliance) runs sponsored financial wellness sessions for employees, students, business owners and communities across India.',
        graph=[ORG, FOUNDER, WEBSITE, BOOK]),
    'programs.html': dict(
        path='/programs.html', title='Financial Wellness Programs for Every Life Stage | WENA',
        desc='Six financial wellness programs for students, employees, business owners, retirees, communities and families, in sponsored sessions for groups of 30+.',
        graph=[{'@type': 'ItemList', 'name': 'WENA financial wellness programs', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'item': {
                '@type': 'Service', 'name': n, 'serviceType': 'Financial wellness education',
                'audience': {'@type': 'Audience', 'audienceType': a}, 'provider': ORG_REF,
                'areaServed': {'@type': 'Country', 'name': 'India'}, 'url': f'{SITE}/programs.html#{k}'}}
            for i, (k, n, a) in enumerate(PROGRAMS)]},
            crumbs(('Home', SITE + '/'), ('Programs', SITE + '/programs.html'))]),
    'store.html': dict(
        path='/store.html', title='Financial Planners, Trackers & Wellness Kits | WENA Store',
        desc='Budget planners, expense trackers, fraud and tax checklists, and corporate wellness kits that help you act on what you learn in WENA sessions.',
        graph=[{'@type': 'CollectionPage', 'name': 'WENA Store', 'url': SITE + '/store.html', 'isPartOf': {'@id': SITE + '/#website'},
                'about': 'Financial wellness planners, trackers, checklists and kits'},
               crumbs(('Home', SITE + '/'), ('Store', SITE + '/store.html'))]),
    'partners.html': dict(
        path='/partners.html', title='Financial Implementation Partners in India | WENA',
        desc='After a WENA session, get help acting on it: vetted CAs, SEBI-registered advisers, IRDAI-licensed advisors and advocates, with fees agreed upfront.',
        graph=[{'@type': 'Service', 'name': 'WENA Implementation Partners', 'serviceType': 'Referral to vetted financial professionals',
                'provider': ORG_REF, 'areaServed': {'@type': 'Country', 'name': 'India'}, 'url': SITE + '/partners.html'},
               crumbs(('Home', SITE + '/'), ('Implementation Partners', SITE + '/partners.html'))]),
    'blog.html': dict(
        path='/blog.html', title='Budgeting, Saving & Investing Blog | WENA',
        desc='Practical, education-only guides on budgeting, saving, PPF, mutual funds and salary planning for people across India, from WENA.',
        graph=None),  # filled with Blog + posts at build time
    'privacy.html': dict(
        path='/privacy.html', title='Privacy Policy | WENA',
        desc='How WENA (Wellness Education Network & Alliance) collects, uses and protects information on wena.co.in, including cookies and Google AdSense advertising.',
        graph=[crumbs(('Home', SITE + '/'), ('Privacy Policy', SITE + '/privacy.html'))]),
    'course.html': dict(
        path='/course.html', title='Video Course & Book | WENA', desc='WENA video course and the book Start Small, Grow Big.',
        graph=None, robots='noindex, follow'),
    'article.html': dict(
        path='/blog.html', title='Article | WENA Blog', desc='Financial wellness article from the WENA blog.',
        graph=None, robots='noindex, follow', canonical=False),
}


def esc(s):
    return html.escape(s, quote=True)


def head_block(title, desc, url, og_type='website', image=OG_IMAGE, robots='index, follow, max-image-preview:large',
               graph=None, canonical=True, prefix='', extra=''):
    ld = ''
    if graph:
        data = {'@context': 'https://schema.org', '@graph': graph}
        ld = '<script type="application/ld+json">\n' + json.dumps(data, ensure_ascii=False, indent=1).replace('</', '<\\/') + '\n</script>\n'
    can = f'<link rel="canonical" href="{esc(url)}">\n' if canonical else ''
    return (f'{START}\n<title>{esc(title)}</title>\n'
            f'<meta name="description" content="{esc(desc)}">\n'
            f'<meta name="robots" content="{robots}">\n{can}'
            f'<meta name="theme-color" content="#0B2D4A">\n'
            f'<link rel="icon" href="{prefix}assets/favicon.ico" sizes="any">\n'
            f'<link rel="icon" type="image/png" href="{prefix}assets/favicon-48.png" sizes="48x48">\n'
            f'<link rel="apple-touch-icon" href="{prefix}assets/apple-touch-icon.png">\n'
            f'<meta property="og:type" content="{og_type}">\n'
            f'<meta property="og:site_name" content="WENA - {esc(FULL)}">\n'
            f'<meta property="og:locale" content="en_IN">\n'
            f'<meta property="og:title" content="{esc(title)}">\n'
            f'<meta property="og:description" content="{esc(desc)}">\n'
            f'<meta property="og:url" content="{esc(url)}">\n'
            f'<meta property="og:image" content="{esc(image)}">\n'
            f'<meta name="twitter:card" content="summary_large_image">\n'
            f'<meta name="twitter:title" content="{esc(title)}">\n'
            f'<meta name="twitter:description" content="{esc(desc)}">\n'
            f'<meta name="twitter:image" content="{esc(image)}">\n'
            f'{extra}{ld}{END}')


STRIP = [r'<title[^>]*>.*?</title>\s*', r'<meta\s+name="(description|robots|theme-color|twitter:[^"]*)"[^>]*>\s*',
         r'<meta\s+property="og:[^"]*"[^>]*>\s*', r'<link\s+rel="(canonical|icon|apple-touch-icon|shortcut icon)"[^>]*>\s*',
         r'<script type="application/ld\+json">.*?</script>\s*']


def set_head(src, block):
    if START in src:
        return re.sub(re.escape(START) + '.*?' + re.escape(END), lambda m: block, src, flags=re.S)
    head = re.search(r'<head>(.*?)</head>', src, re.S)
    h = head.group(1)
    for p in STRIP:
        h = re.sub(p, '', h, flags=re.S | re.I)
    h = re.sub(r'(<meta name="viewport"[^>]*>\s*)', lambda m: m.group(1) + block + '\n', h, count=1)
    return src[:head.start(1)] + h + src[head.end(1):]


# ---------------------------------------------------------------- blog
def parse_md(raw):
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', raw, re.S)
    meta, body = {}, raw
    if m:
        body = m.group(2)
        for line in m.group(1).splitlines():
            if ':' in line:
                k, v = line.split(':', 1)
                v = v.strip()
                if len(v) >= 2 and v[0] == v[-1] and v[0] in '\'"':
                    v = v[1:-1].replace("''", "'")
                meta[k.strip()] = v
    return meta, body.strip()


def parse_date(s):
    for fmt in ('%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M', '%Y-%m-%d'):
        try:
            return dt.datetime.strptime(s[:19], fmt)
        except (ValueError, TypeError):
            pass
    return dt.datetime(2026, 1, 1)


def img_url(p):
    if not p:
        return ''
    if p.startswith('http'):
        return p
    return SITE + urllib.parse.quote('/' + p.lstrip('/'))


def git_date(rel):
    """Last commit time of a file, in IST, so dates are stable across checkouts."""
    import subprocess
    try:
        out = subprocess.run(['git', 'log', '-1', '--format=%ct', '--', rel], cwd=ROOT,
                             capture_output=True, text=True).stdout.strip()
        if out:
            return dt.datetime.utcfromtimestamp(int(out)) + dt.timedelta(hours=5, minutes=30)
    except Exception:
        pass
    return None


def rel_img(p, prefix=''):
    if not p or p.startswith('http'):
        return p
    return prefix + urllib.parse.quote(p.lstrip('/'))


def load_posts():
    d = os.path.join(ROOT, 'content', 'blog')
    posts = []
    for fn in sorted(os.listdir(d)):
        if not fn.endswith('.md'):
            continue
        raw = open(os.path.join(d, fn), encoding='utf-8').read()
        meta, body = parse_md(raw)
        slug = fn[:-3]
        date = parse_date(meta.get('date', ''))
        modified = git_date(os.path.join('content', 'blog', fn)) or date
        posts.append(dict(slug=slug, title=meta.get('title', slug.replace('-', ' ').title()),
                          excerpt=meta.get('excerpt') or meta.get('summary') or '', image=meta.get('image', ''),
                          date=date, modified=max(date, modified), body=body))
    posts.sort(key=lambda p: p['date'], reverse=True)
    return posts


ARTICLE_CSS = open(os.path.join(ROOT, 'tools', 'article.css'), encoding='utf-8').read() if os.path.exists(os.path.join(ROOT, 'tools', 'article.css')) else ''


def post_page(p, posts):
    url = f"{SITE}/blog/{urllib.parse.quote(p['slug'])}.html"
    image = img_url(p['image']) or OG_IMAGE
    desc = p['excerpt'][:300] or p['title']
    body_html = markdown.markdown(p['body'], extensions=['extra', 'sane_lists'])
    words = len(re.sub('<[^>]+>', ' ', body_html).split())
    graph = [{'@type': 'BlogPosting', 'headline': p['title'][:110], 'description': desc, 'image': image,
              'datePublished': p['date'].strftime('%Y-%m-%dT%H:%M:%S+05:30'),
              'dateModified': p['modified'].strftime('%Y-%m-%dT%H:%M:%S+05:30'),
              'author': {'@type': 'Person', 'name': 'Nitu Sharma', 'url': SITE + '/#founder'},
              'publisher': {'@type': 'Organization', 'name': 'WENA', 'logo': {'@type': 'ImageObject', 'url': LOGO}},
              'mainEntityOfPage': url, 'inLanguage': 'en-IN', 'wordCount': words},
             crumbs(('Home', SITE + '/'), ('Blog', SITE + '/blog.html'), (p['title'], url))]
    extra = (f'<meta property="article:published_time" content="{p["date"].strftime("%Y-%m-%dT%H:%M:%S+05:30")}">\n'
             f'<meta property="article:modified_time" content="{p["modified"].strftime("%Y-%m-%dT%H:%M:%S+05:30")}">\n'
             f'<meta property="article:author" content="Nitu Sharma">\n')
    head = head_block(f"{p['title']} | WENA", desc, url, 'article', image, graph=graph, prefix='../', extra=extra)
    others = [o for o in posts if o['slug'] != p['slug']][:3]
    more = ''.join(f'<li><a href="{esc(urllib.parse.quote(o["slug"]))}.html">{esc(o["title"])}</a></li>' for o in others)
    cover = (f'<div class="art-cover"><img src="{esc(rel_img(p["image"], "../"))}" alt="{esc(p["title"])}" fetchpriority="high"></div>'
             if p['image'] else '')
    return f'''<!DOCTYPE html>
<html lang="en-IN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{head}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<style>{ARTICLE_CSS}</style>
{ADSENSE}
</head>
<body>
<header>
  <div class="container wide">
    <a href="../index.html" class="logo"><img src="../assets/logo-360.png" alt="WENA logo" width="78" height="52"><span>{esc(FULL)}</span></a>
    <nav aria-label="Main"><a href="../index.html">Home</a><a href="../programs.html">Programs</a><a href="../store.html">Store</a><a href="../blog.html">Blog</a><a href="../index.html#contact">Contact</a></nav>
  </div>
</header>
<main class="container">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a> › <a href="../blog.html">Blog</a> › <span>{esc(p['title'])}</span></nav>
  <article>
    <header class="art-head">
      <time class="art-date" datetime="{p['date'].strftime('%Y-%m-%d')}">{p['date'].strftime('%-d %B %Y')}</time>
      <h1>{esc(p['title'])}</h1>
      <p class="byline">By Nitu Sharma, Founder, WENA</p>
    </header>
    {cover}
    <div class="art-body">{body_html}</div>
  </article>
  <aside class="cta">
    <h2>Bring this to your team</h2>
    <p>WENA runs sponsored educational financial awareness sessions for workplaces, colleges, business groups and communities (30+ participants).</p>
    <a class="btn" href="../index.html#contact">Request a session</a>
  </aside>
  {f'<section class="more"><h2>More from the WENA blog</h2><ul>{more}</ul></section>' if more else ''}
  <p class="disclaimer">This article is for education only and is not investment, tax or legal advice.</p>
</main>
<footer>© {dt.date.today().year} WENA - {esc(FULL)} · Spreading Financial Wellness across India · <a href="mailto:reachout@wena.co.in">reachout@wena.co.in</a> · <a href="../privacy.html">Privacy Policy</a></footer>
</body>
</html>
'''


def blog_list_html(posts):
    cards = []
    for p in posts:
        img = (f'<img src="{esc(rel_img(p["image"]))}" alt="{esc(p["title"])}" loading="lazy">' if p['image']
               else '<i class="fa-solid fa-book-open"></i>')
        cards.append(f'''<a href="blog/{esc(urllib.parse.quote(p['slug']))}.html" class="blog-card">
        <div class="img-wrap">{img}</div>
        <div class="blog-body">
          <div class="blog-date">{p['date'].strftime('%-d %B %Y')}</div>
          <h3>{esc(p['title'])}</h3>
          <p>{esc(p['excerpt'])}</p>
          <span class="blog-read">Read Article <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </a>''')
    return '\n'.join(cards)


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    old = open(full, encoding='utf-8').read() if os.path.exists(full) else None
    if old != text:
        open(full, 'w', encoding='utf-8').write(text)
        print('wrote', path)


def main(pages=False):
    posts = load_posts()
    # static post pages
    os.makedirs(os.path.join(ROOT, 'blog'), exist_ok=True)
    live = set()
    for p in posts:
        live.add(p['slug'] + '.html')
        write(f"blog/{p['slug']}.html", post_page(p, posts))
    for fn in os.listdir(os.path.join(ROOT, 'blog')):
        if fn.endswith('.html') and fn not in live:
            os.remove(os.path.join(ROOT, 'blog', fn)); print('removed blog/' + fn)

    # blog.html: schema + pre-rendered list
    PAGES['blog.html']['graph'] = [
        {'@type': 'Blog', '@id': SITE + '/blog.html#blog', 'name': 'WENA Blog', 'url': SITE + '/blog.html', 'publisher': ORG_REF,
         'inLanguage': 'en-IN', 'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'][:110],
                                              'url': f"{SITE}/blog/{urllib.parse.quote(p['slug'])}.html",
                                              'datePublished': p['date'].strftime('%Y-%m-%d')} for p in posts]},
        crumbs(('Home', SITE + '/'), ('Blog', SITE + '/blog.html'))]
    targets = PAGES if pages else {'blog.html': PAGES['blog.html']}
    for fn, cfg in targets.items():
        src = open(os.path.join(ROOT, fn), encoding='utf-8').read()
        block = head_block(cfg['title'], cfg['desc'], SITE + cfg['path'], graph=cfg['graph'],
                           robots=cfg.get('robots', 'index, follow, max-image-preview:large'), canonical=cfg.get('canonical', True))
        out = set_head(src, block)
        out = re.sub(r'<html lang="en">', '<html lang="en-IN">', out, count=1)
        if fn == 'blog.html':
            out = re.sub(r'(<!-- BLOG-LIST:START -->).*?(<!-- BLOG-LIST:END -->)',
                         lambda m: m.group(1) + '\n' + blog_list_html(posts) + '\n' + m.group(2), out, flags=re.S)
        write(fn, out)

    # sitemap
    today = dt.date.today().isoformat()
    urls = [('/', today, '1.0'), ('/programs.html', today, '0.9'), ('/store.html', today, '0.7'),
            ('/partners.html', today, '0.7'), ('/blog.html', posts[0]['modified'].date().isoformat() if posts else today, '0.8'),
            ('/privacy.html', today, '0.2')]
    urls += [(f"/blog/{urllib.parse.quote(p['slug'])}.html", p['modified'].date().isoformat(), '0.6') for p in posts]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    old = open(os.path.join(ROOT, 'sitemap.xml')).read() if os.path.exists(os.path.join(ROOT, 'sitemap.xml')) else ''
    for path, lm, pr in urls:
        prev = re.search(re.escape(f'<loc>{SITE}{path}</loc>') + r'<lastmod>([^<]+)</lastmod>', old)
        if prev and not path.startswith('/blog'):
            lm = prev.group(1)  # keep stable dates for pages so the file only changes when content does
        sm.append(f'  <url><loc>{SITE}{path}</loc><lastmod>{lm}</lastmod><priority>{pr}</priority></url>')
    sm.append('</urlset>')
    write('sitemap.xml', '\n'.join(sm) + '\n')


if __name__ == '__main__':
    main(pages='--pages' in sys.argv)
