
    // GET /consciousness-3d - 3D意识空间可视化
    if (req.method === 'GET' && (url.pathname === '/consciousness-3d' || url.pathname === '/consciousness-3d.html')) {
      if (config.needsActivation) {
        res.writeHead(302, { Location: '/activation' })
        res.end()
        return
      }
      try {
        const html = fs.readFileSync(CONSCIOUSNESS_3D_PATH, 'utf-8')
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
      } catch {
        res.writeHead(404)
        res.end('consciousness-3d.html not found')
      }
      return
    }