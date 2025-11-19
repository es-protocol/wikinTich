// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for Request/Response APIs needed for Next.js API route tests
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Polyfill for Request API (needed for NextRequest)
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      // Use Object.defineProperty to make url read-only (like NextRequest expects)
      const url = typeof input === 'string' ? input : input.url
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
        configurable: false
      })
      this.method = init.method || 'GET'
      this.headers = new Headers(init.headers || {})
      this.body = init.body || null
    }
    async json() {
      if (!this.body) {
        throw new Error('Body is null')
      }
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {}
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value
        })
      }
    }
    get(name) {
      return this._headers[name.toLowerCase()] || null
    }
    set(name, value) {
      this._headers[name.toLowerCase()] = value
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.statusText = init.statusText || 'OK'
      this.headers = new Headers(init.headers || {})
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
    // Static helper to match the Fetch API/Next.js expectations:
    // Response.json(body, init?) → Response
    static json(body, init = {}) {
      const headers = {
        'Content-Type': 'application/json',
        ...(init.headers || {})
      }
      return new Response(JSON.stringify(body), {
        ...init,
        headers
      })
    }
  }
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

