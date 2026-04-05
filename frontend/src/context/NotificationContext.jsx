import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

const WS_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/^http/, "ws");

export default function NotificationProvider({ children }) {
  const { loggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT = 5;

  const connect = useCallback(() => {
    if (!loggedIn || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(`${WS_BASE}/ws/notifications`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "connected") {
            setUnreadCount(data.unread_count || 0);
          } else if (data.type === "notification") {
            setNotifications((prev) => [data.notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else if (data.type === "unread_update") {
            setUnreadCount(data.unread_count || 0);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = (e) => {
        setIsConnected(false);
        wsRef.current = null;

        if (loggedIn && e.code !== 4001 && reconnectAttempts.current < MAX_RECONNECT) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current += 1;
          reconnectTimer.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket constructor failed
    }
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      connect();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
    }

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [loggedIn, connect]);

  const markRead = useCallback((notificationId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "mark_read", id: notificationId }));
    }
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, isConnected, markRead, markAllRead, setNotifications, setUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
