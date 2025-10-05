# Technical Specifications - Messaging Service

## 🎯 **OVERVIEW**

This document provides detailed technical specifications for the messaging service development, including database schemas, API endpoints, data structures, and integration points.

## 🗄️ **DATABASE SCHEMA**

### **Messages Table**
```sql
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id),
  receiver_id uuid NOT NULL REFERENCES profiles(id),
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

**Table Relationships:**
- `sender_id` → `profiles.id` (who sent the message)
- `receiver_id` → `profiles.id` (who received the message)

**Indexes to Consider:**
```sql
-- For efficient message retrieval
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);
```

### **Notifications Table**
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('request', 'payment', 'message', 'system')),
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);
```

**Table Relationships:**
- `user_id` → `profiles.id` (who receives the notification)

**Indexes to Consider:**
```sql
-- For efficient notification retrieval
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## 🔧 **API ENDPOINTS SPECIFICATIONS**

### **1. Send Message API**

**Endpoint**: `POST /api/messages/send`

**Authentication**: Required (JWT token in Authorization header)

**Request Body:**
```typescript
interface SendMessageRequest {
  receiver_id: string
  message_type: 'text' | 'image' | 'file'
  content: string
  file?: File // for image/file messages
}
```

**Response:**
```typescript
interface SendMessageResponse {
  success: boolean
  message?: {
    id: string
    sender_id: string
    receiver_id: string
    message_type: string
    content: string
    is_read: boolean
    read_at: string | null
    created_at: string
  }
  error?: string
}
```

**Implementation Details:**
- Validate user authentication
- Validate message content (length, type)
- Validate receiver exists and is accessible
- Store message in database
- Create notification for receiver
- Return success response with message data

### **2. Get Messages API**

**Endpoint**: `GET /api/messages/get`

**Authentication**: Required (JWT token in Authorization header)

**Query Parameters:**
```typescript
interface GetMessagesQuery {
  other_user_id: string
  page?: number // default: 1
  limit?: number // default: 50, max: 100
  mark_as_read?: boolean // default: true
}
```

**Response:**
```typescript
interface GetMessagesResponse {
  success: boolean
  messages?: Message[]
  has_more?: boolean
  total_count?: number
  error?: string
}
```

**Implementation Details:**
- Validate user authentication
- Validate other_user_id exists
- Retrieve messages between authenticated user and other_user_id
- Support pagination with page and limit
- Optionally mark messages as read
- Return messages in chronological order

### **3. File Upload API**

**Endpoint**: `POST /api/messages/upload`

**Authentication**: Required (JWT token in Authorization header)

**Request:**
```typescript
interface FileUploadRequest {
  file: File
  message_type: 'image' | 'file'
}
```

**Response:**
```typescript
interface FileUploadResponse {
  success: boolean
  file_url?: string
  file_name?: string
  file_size?: number
  mime_type?: string
  error?: string
}
```

**Implementation Details:**
- Validate user authentication
- Validate file type and size
- Upload file to Supabase Storage
- Generate public URL
- Return file information

### **4. Mark as Read API**

**Endpoint**: `POST /api/messages/read`

**Authentication**: Required (JWT token in Authorization header)

**Request Body:**
```typescript
interface MarkAsReadRequest {
  message_id: string
}
```

**Response:**
```typescript
interface MarkAsReadResponse {
  success: boolean
  error?: string
}
```

**Implementation Details:**
- Validate user authentication
- Validate message exists and belongs to user
- Update message read status
- Update read_at timestamp

### **5. Get Notifications API**

**Endpoint**: `GET /api/notifications/get`

**Authentication**: Required (JWT token in Authorization header)

**Query Parameters:**
```typescript
interface GetNotificationsQuery {
  type?: 'request' | 'payment' | 'message' | 'system'
  page?: number // default: 1
  limit?: number // default: 20, max: 50
}
```

**Response:**
```typescript
interface GetNotificationsResponse {
  success: boolean
  notifications?: Notification[]
  has_more?: boolean
  total_count?: number
  error?: string
}
```

**Implementation Details:**
- Validate user authentication
- Retrieve user notifications
- Support filtering by type
- Support pagination
- Return notifications in chronological order

## 📊 **DATA STRUCTURES**

### **Message Interface**
```typescript
interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message_type: 'text' | 'image' | 'file'
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
  // Extended fields for UI
  sender_name?: string
  sender_avatar?: string
  receiver_name?: string
  receiver_avatar?: string
  file_url?: string
  file_name?: string
  file_size?: number
  mime_type?: string
}
```

### **Notification Interface**
```typescript
interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  notification_type: 'request' | 'payment' | 'message' | 'system'
  is_read: boolean
  read_at: string | null
  created_at: string
  // Extended fields for UI
  sender_name?: string
  sender_avatar?: string
  action_url?: string
}
```

### **User Profile Interface**
```typescript
interface UserProfile {
  id: string
  full_name: string
  avatar_url?: string
  email: string
  role: 'parent' | 'tutor' | 'admin' | 'super_admin'
  is_online?: boolean
  last_seen?: string
}
```

## 🔄 **REAL-TIME MESSAGING IMPLEMENTATION**

### **Option 1: Polling (Recommended for MVP)**

**Frontend Implementation:**
```typescript
// Polling service
class MessagePollingService {
  private intervalId: NodeJS.Timeout | null = null
  private lastMessageId: string | null = null

  startPolling(otherUserId: string, onNewMessage: (message: Message) => void) {
    this.intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages/get?other_user_id=${otherUserId}&since=${this.lastMessageId}`)
        const data = await response.json()
        
        if (data.success && data.messages) {
          data.messages.forEach((message: Message) => {
            onNewMessage(message)
            this.lastMessageId = message.id
          })
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }
}
```

**Backend Support:**
```typescript
// Add 'since' parameter to Get Messages API
interface GetMessagesQuery {
  other_user_id: string
  since?: string // message ID to get messages after
  page?: number
  limit?: number
  mark_as_read?: boolean
}
```

### **Option 2: WebSockets (Advanced)**

**Implementation with Supabase Realtime:**
```typescript
// Frontend WebSocket connection
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Subscribe to message changes
const subscribeToMessages = (userId: string, onNewMessage: (message: Message) => void) => {
  return supabase
    .channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`
    }, (payload) => {
      onNewMessage(payload.new as Message)
    })
    .subscribe()
}
```

## 🔐 **SECURITY CONSIDERATIONS**

### **Authentication & Authorization**
- All API endpoints require valid JWT token
- Verify user can access messages with specific users
- Validate file uploads (type, size, content)
- Sanitize message content to prevent XSS

### **Input Validation**
```typescript
// Message content validation
const validateMessageContent = (content: string, type: string): boolean => {
  if (type === 'text') {
    return content.length > 0 && content.length <= 1000
  }
  if (type === 'image') {
    return content.startsWith('http') && content.includes('supabase')
  }
  if (type === 'file') {
    return content.startsWith('http') && content.includes('supabase')
  }
  return false
}
```

### **File Upload Security**
- Validate file types (images: jpg, png, gif; files: pdf, doc, docx)
- Limit file sizes (images: 5MB, files: 10MB)
- Scan files for malware (if possible)
- Store files in secure, private buckets

## 📱 **FRONTEND INTEGRATION**

### **Component Architecture**
```
components/messaging/
├── ChatInterface.tsx          # Main chat container
├── MessageList.tsx            # Message display list
├── MessageBubble.tsx          # Individual message bubble
├── MessageInput.tsx           # Message input form
├── ChatHeader.tsx             # Chat header with user info
├── MessageNotification.tsx    # Message notifications
├── FileUpload.tsx             # File upload component
└── hooks/
    ├── useMessages.ts         # Message management hook
    ├── useNotifications.ts    # Notification management hook
    └── useRealTime.ts         # Real-time messaging hook
```

### **State Management**
```typescript
// Message state interface
interface MessageState {
  messages: Message[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  isTyping: boolean
  typingUsers: string[]
}

// Notification state interface
interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
}
```

### **Custom Hooks**
```typescript
// useMessages hook
export const useMessages = (otherUserId: string) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async (content: string, type: 'text' | 'image' | 'file') => {
    // Implementation
  }

  const loadMessages = async (page: number = 1) => {
    // Implementation
  }

  const markAsRead = async (messageId: string) => {
    // Implementation
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    loadMessages,
    markAsRead
  }
}
```

## 🧪 **TESTING SPECIFICATIONS**

### **API Testing**
```typescript
// Example API test
describe('Send Message API', () => {
  test('should send message successfully', async () => {
    const response = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        receiver_id: 'valid-user-id',
        message_type: 'text',
        content: 'Hello, world!'
      })
      .expect(200)

    expect(response.body.success).toBe(true)
    expect(response.body.message).toBeDefined()
    expect(response.body.message.content).toBe('Hello, world!')
  })
})
```

### **Component Testing**
```typescript
// Example component test
describe('MessageBubble Component', () => {
  test('should render message content correctly', () => {
    const message = {
      id: '1',
      content: 'Hello, world!',
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString()
    }

    render(<MessageBubble message={message} isOwn={true} />)
    
    expect(screen.getByText('Hello, world!')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
  })
})
```

## 📈 **PERFORMANCE CONSIDERATIONS**

### **Database Optimization**
- Use proper indexes for message queries
- Implement message pagination
- Consider message archiving for old conversations
- Use database connection pooling

### **Frontend Optimization**
- Implement virtual scrolling for large message lists
- Use React.memo for message components
- Implement message caching
- Optimize image loading and compression

### **Real-time Optimization**
- Use efficient polling intervals
- Implement connection pooling for WebSockets
- Consider message batching
- Implement offline message queuing

## 🚀 **DEPLOYMENT CONSIDERATIONS**

### **Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# File Upload Configuration
MAX_FILE_SIZE=10485760 # 10MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/gif
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Real-time Configuration
POLLING_INTERVAL=5000 # 5 seconds
WEBSOCKET_URL=your_websocket_url
```

### **Supabase Storage Setup**
```sql
-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public) VALUES ('message-files', 'message-files', true);

-- Set up RLS policies for message files
CREATE POLICY "Users can upload message files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'message-files');

CREATE POLICY "Users can view message files" ON storage.objects
FOR SELECT USING (bucket_id = 'message-files');
```

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: Development Team