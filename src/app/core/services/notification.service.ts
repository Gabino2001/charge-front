import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  list(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.baseUrl);
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  markRead(notificationId: number): Observable<Notification> {
    return this.http.patch<Notification>(`${this.baseUrl}/${notificationId}/read`, {});
  }
}
