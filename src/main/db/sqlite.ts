import initSqlJs, { Database } from 'sql.js'
import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

export class HiveDatabase {
  private db: Database | null = null
  private dbPath: string

  constructor(private storageDir: string) {
    this.dbPath = join(storageDir, 'hive.db')
    if (!existsSync(storageDir)) {
      mkdirSync(storageDir, { recursive: true })
    }
  }

  async init(): Promise<void> {
    const SQL = await initSqlJs()

    if (existsSync(this.dbPath)) {
      const buffer = readFileSync(this.dbPath)
      this.db = new SQL.Database(buffer)
    } else {
      this.db = new SQL.Database()
      this.createTables()
      this.save()
    }
  }

  private createTables(): void {
    if (!this.db) return

    this.db.run(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        accent_color TEXT,
        sprite TEXT,
        state TEXT DEFAULT 'idle',
        station TEXT,
        cwd TEXT,
        command TEXT,
        is_god INTEGER DEFAULT 0,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        created_at INTEGER,
        FOREIGN KEY (agent_id) REFERENCES agents (id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        performative TEXT NOT NULL,
        sender TEXT NOT NULL,
        receiver TEXT NOT NULL,
        in_reply_to TEXT,
        content_json TEXT NOT NULL,
        timestamp INTEGER
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        pipeline_json TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        current_stage INTEGER DEFAULT 0,
        assigned_to TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );
    `)
  }

  save(): void {
    if (!this.db) return
    const data = this.db.export()
    const buffer = Buffer.from(data)
    writeFileSync(this.dbPath, buffer)
  }

  // Agent Operations
  upsertAgent(agent: any): void {
    if (!this.db) return
    this.db.run(`
      INSERT OR REPLACE INTO agents (id, name, role, accent_color, sprite, state, station, cwd, command, is_god, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agent.id,
      agent.name,
      agent.role,
      agent.accentColor,
      agent.sprite,
      agent.state || 'idle',
      agent.currentStation || null,
      agent.cwd,
      agent.command,
      agent.isGod ? 1 : 0,
      Date.now()
    ])
    this.save()
  }

  deleteAgent(id: string): void {
    if (!this.db) return
    this.db.run(`DELETE FROM memories WHERE agent_id = ?`, [id])
    this.db.run(`DELETE FROM agents WHERE id = ? AND is_god = 0`, [id])
    this.save()
  }

  deleteAllWorkers(): string[] {
    if (!this.db) return []
    const stmt = this.db.prepare(`SELECT id FROM agents WHERE is_god = 0`)
    const ids: string[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      ids.push(row.id as string)
    }
    stmt.free()

    for (const id of ids) {
      this.db.run(`DELETE FROM memories WHERE agent_id = ?`, [id])
    }
    this.db.run(`DELETE FROM agents WHERE is_god = 0`)
    this.save()
    return ids
  }

  getAgents(): any[] {
    if (!this.db) return []
    const stmt = this.db.prepare('SELECT * FROM agents')
    const results: any[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push({
        id: row.id,
        name: row.name,
        role: row.role,
        accentColor: row.accent_color,
        sprite: row.sprite,
        state: row.state,
        currentStation: row.station,
        cwd: row.cwd,
        command: row.command,
        isGod: row.is_god === 1
      })
    }
    stmt.free()
    return results
  }

  // Memory Search
  searchMemories(query: string, agentId?: string): any[] {
    if (!this.db) return []
    let sql = `SELECT * FROM memories WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)`
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`]

    if (agentId) {
      sql += ` AND agent_id = ?`
      params.push(agentId)
    }

    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const results: any[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  }

  addMemory(id: string, agentId: string, title: string, content: string, tags: string[] = []): void {
    if (!this.db) return
    this.db.run(`
      INSERT OR REPLACE INTO memories (id, agent_id, title, content, tags, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, agentId, title, content, JSON.stringify(tags), Date.now()])
    this.save()
  }

  // Message logging
  logMessage(message: any): void {
    if (!this.db) return
    this.db.run(`
      INSERT OR REPLACE INTO messages (id, performative, sender, receiver, in_reply_to, content_json, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      message.id,
      message.performative,
      message.sender,
      message.receiver,
      message.inReplyTo || null,
      JSON.stringify(message.content),
      message.timestamp || Date.now()
    ])
    this.save()
  }

  getMessages(limit: number = 100): any[] {
    if (!this.db) return []
    const stmt = this.db.prepare(`SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?`)
    stmt.bind([limit])
    const results: any[] = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push({
        id: row.id,
        performative: row.performative,
        sender: row.sender,
        receiver: row.receiver,
        inReplyTo: row.in_reply_to,
        content: JSON.parse(row.content_json as string || '{}'),
        timestamp: row.timestamp
      })
    }
    stmt.free()
    return results
  }
}
