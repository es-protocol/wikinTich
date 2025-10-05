# Complete Messaging Service Development Task Brief

## 🎯 **TASK OVERVIEW**

You are tasked with developing the **complete messaging service** for the Tutor Link platform. This includes building both the frontend UI and backend API to enable secure, real-time communication between parents and tutors.

## 📋 **YOUR RESPONSIBILITIES**

### **What You Will Build:**
- ✅ **Complete messaging system** - frontend UI + backend API
- ✅ **Frontend components** - chat interface, message display, input forms
- ✅ **Backend API endpoints** - send/receive messages, file uploads
- ✅ **Database operations** - CRUD operations on messages and notifications
- ✅ **Real-time messaging** - live message updates
- ✅ **File handling** - image/document uploads
- ✅ **Notification system** - message notifications

### **What You Will NOT Touch:**
- ❌ **Authentication system** - already implemented
- ❌ **User management** - already implemented
- ❌ **Parent/tutor workflows** - handled by other team members
- ❌ **Admin dashboards** - handled by other team members

## 🗄️ **DATABASE SCHEMA (ALREADY SET UP)**

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

## 🎨 **FRONTEND COMPONENTS TO BUILD**

### **1. ChatInterface Component**
**File**: `components/messaging/ChatInterface.tsx`

**Features:**
- [ ] **Header** - user info, online status, call/video buttons
- [ ] **Message list** - scrollable message history
- [ ] **Input area** - text input, send button, file upload
- [ ] **Responsive layout** - works on mobile and desktop
- [ ] **Loading states** - skeleton loaders while loading messages

### **2. MessageList Component**
**File**: `components/messaging/MessageList.tsx`

**Features:**
- [ ] **Message display** - show all messages in conversation
- [ ] **Auto-scroll** - scroll to bottom on new messages
- [ ] **Message grouping** - group messages by date
- [ ] **Load more** - pagination for message history
- [ ] **Smooth scrolling** - animated scroll behavior

### **3. MessageBubble Component**
**File**: `components/messaging/MessageBubble.tsx`

**Features:**
- [ ] **Message display** - text, images, files
- [ ] **Timestamp** - relative time display
- [ ] **Read receipts** - show read status
- [ ] **Message status** - sent, delivered, read
- [ ] **Context menu** - copy, delete, forward options

### **4. MessageInput Component**
**File**: `components/messaging/MessageInput.tsx`

**Features:**
- [ ] **Text input** - multiline text area
- [ ] **Send button** - send message on click/enter
- [ ] **File upload** - drag & drop, click to upload
- [ ] **Emoji picker** - emoji selection
- [ ] **Typing indicator** - show when typing

### **5. ChatHeader Component**
**File**: `components/messaging/ChatHeader.tsx`

**Features:**
- [ ] **User info** - name, avatar, online status
- [ ] **Action buttons** - call, video, more options
- [ ] **Back button** - navigate back to conversation list
- [ ] **Search** - search within conversation
- [ ] **Settings** - conversation settings

### **6. MessageNotification Component**
**File**: `components/messaging/MessageNotification.tsx`

**Features:**
- [ ] **Notification display** - show new message notifications
- [ ] **Click to open** - navigate to conversation
- [ ] **Dismiss** - close notification
- [ ] **Sound** - optional notification sound
- [ ] **Badge count** - show unread message count

## 🔧 **BACKEND API ENDPOINTS TO BUILD**

### **1. Send Message API**
**File**: `app/api/messages/send/route.ts`

**Endpoint**: `POST /api/messages/send`

**Features:**
- [ ] **Message validation** - validate message content and type
- [ ] **User authentication** - verify sender is authenticated
- [ ] **Database insertion** - store message in database
- [ ] **Notification creation** - create notification for receiver
- [ ] **File handling** - handle image/file uploads
- [ ] **Error handling** - proper error responses

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
    created_at: string
  }
  error?: string
}
```

### **2. Get Messages API**
**File**: `app/api/messages/get/route.ts`

**Endpoint**: `GET /api/messages/get`

**Features:**
- [ ] **User authentication** - verify user is authenticated
- [ ] **Message retrieval** - get messages between users
- [ ] **Pagination** - support for loading more messages
- [ ] **Message formatting** - format messages for frontend
- [ ] **Read status** - mark messages as read
- [ ] **Error handling** - proper error responses

**Query Parameters:**
```typescript
interface GetMessagesQuery {
  other_user_id: string
  page?: number
  limit?: number
  mark_as_read?: boolean
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

### **3. File Upload API**
**File**: `app/api/messages/upload/route.ts`

**Endpoint**: `POST /api/messages/upload`

**Features:**
- [ ] **File validation** - validate file type and size
- [ ] **User authentication** - verify user is authenticated
- [ ] **File storage** - store file in Supabase Storage
- [ ] **URL generation** - generate public URL for file
- [ ] **Error handling** - proper error responses

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
  error?: string
}
```

### **4. Mark as Read API**
**File**: `app/api/messages/read/route.ts`

**Endpoint**: `POST /api/messages/read`

**Features:**
- [ ] **User authentication** - verify user is authenticated
- [ ] **Message validation** - verify message exists and belongs to user
- [ ] **Read status update** - update message read status
- [ ] **Timestamp update** - update read_at timestamp
- [ ] **Error handling** - proper error responses

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

### **5. Get Notifications API**
**File**: `app/api/notifications/get/route.ts`

**Endpoint**: `GET /api/notifications/get`

**Features:**
- [ ] **User authentication** - verify user is authenticated
- [ ] **Notification retrieval** - get user notifications
- [ ] **Filtering** - filter by notification type
- [ ] **Pagination** - support for loading more notifications
- [ ] **Error handling** - proper error responses

**Query Parameters:**
```typescript
interface GetNotificationsQuery {
  type?: 'request' | 'payment' | 'message' | 'system'
  page?: number
  limit?: number
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

## 🔄 **REAL-TIME MESSAGING**

### **Option 1: Polling (Recommended for MVP)**
**Implementation:**
- [ ] **Frontend polling** - poll for new messages every 5-10 seconds
- [ ] **Efficient queries** - only fetch new messages since last check
- [ ] **State management** - update message list with new messages
- [ ] **Performance optimization** - stop polling when not active

### **Option 2: WebSockets (Advanced)**
**Implementation:**
- [ ] **WebSocket connection** - establish real-time connection
- [ ] **Message broadcasting** - broadcast messages to connected users
- [ ] **Connection management** - handle connection drops and reconnects
- [ ] **Scalability** - handle multiple concurrent connections

## 🎯 **ACCEPTANCE CRITERIA**

### **Functional Requirements**
- [ ] **Message sending** - users can send text, image, and file messages
- [ ] **Message receiving** - users receive messages in real-time
- [ ] **File uploads** - users can upload and send images/documents
- [ ] **Read receipts** - message read status is tracked and displayed
- [ ] **Notifications** - users receive notifications for new messages
- [ ] **Responsive design** - works on mobile, tablet, and desktop
- [ ] **Accessibility** - keyboard navigation, screen reader support
- [ ] **Performance** - smooth scrolling, fast loading

### **Technical Requirements**
- [ ] **TypeScript** - all components and APIs use proper TypeScript
- [ ] **Error handling** - graceful error handling and user feedback
- [ ] **Loading states** - proper loading indicators
- [ ] **Code quality** - follows established coding standards
- [ ] **Testing** - components and APIs are testable and well-structured
- [ ] **Security** - proper authentication and authorization
- [ ] **Database optimization** - efficient queries and indexing

### **UI/UX Requirements**
- [ ] **Design consistency** - matches existing Tutor Link design
- [ ] **Mobile optimization** - touch-friendly interface
- [ ] **Smooth animations** - polished transitions and effects
- [ ] **Intuitive navigation** - easy to use interface
- [ ] **Visual feedback** - clear feedback for user actions

## 🧪 **TESTING REQUIREMENTS**

### **Manual Testing**
- [ ] **Cross-browser** - test in Chrome, Firefox, Safari, Edge
- [ ] **Mobile devices** - test on iOS and Android
- [ ] **Accessibility** - test with screen readers
- [ ] **Performance** - test with large message lists
- [ ] **Error scenarios** - test network failures, invalid inputs
- [ ] **File uploads** - test various file types and sizes

### **Automated Testing**
- [ ] **Component tests** - test component rendering and behavior
- [ ] **API tests** - test API endpoints and responses
- [ ] **Integration tests** - test component and API interactions
- [ ] **Accessibility tests** - automated accessibility checks
- [ ] **Visual regression** - test for visual changes

## 📅 **DEADLINE & MILESTONES**

### **Week 1: Foundation & API**
- [ ] Set up component structure
- [ ] Create basic API endpoints (send, get messages)
- [ ] Implement basic ChatInterface component
- [ ] Add database operations for messages

### **Week 2: Core Features**
- [ ] Implement MessageList and MessageBubble components
- [ ] Add file upload API and UI
- [ ] Implement read receipts and notifications
- [ ] Add real-time messaging (polling)

### **Week 3: Polish & Testing**
- [ ] Complete all UI components
- [ ] Add animations and transitions
- [ ] Implement comprehensive error handling
- [ ] Test across devices and browsers

## 🚨 **IMPORTANT NOTES**

### **Do Not Modify:**
- Database schemas (already set up)
- Authentication system (already implemented)
- Existing components outside messaging
- Parent/tutor workflow components

### **Follow These Standards:**
- Use existing constants from `lib/constants.ts`
- Follow error handling patterns from `lib/error-handling.ts`
- Use loading states from `lib/loading-states.ts`
- Follow security guidelines from `lib/security.ts`
- Use Supabase client from `lib/supabase.ts`

### **Ask Questions:**
- If you're unsure about requirements
- If you need clarification on design
- If you encounter technical issues
- If you need access to additional resources

## 📞 **SUPPORT & RESOURCES**

- **Design System**: Follow existing Tutor Link design patterns
- **Component Library**: Use existing components as reference
- **Code Standards**: Follow patterns in existing codebase
- **Documentation**: Refer to TECHNICAL_SPECIFICATIONS.md
- **Questions**: Ask team lead or create GitHub issue

---

**Good luck with your messaging service development! 🚀**

**Last Updated**: December 2024  
**Version**: 1.0  
**Assigned To**: [Your Name]  
**Due Date**: [To be determined]
