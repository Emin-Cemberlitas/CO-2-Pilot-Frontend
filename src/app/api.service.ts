import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private apiUrl = 'https://co-2-pilot-a0h8b8fehudqhbfy.westeurope-01.azurewebsites.net';

  constructor(private http: HttpClient) { }

  // Send data to calculate endpoint
  sendData(data: any): Observable<any> {
    const options = {
      withCredentials: true, // Ensure cookies are sent
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      })
    };
    console.log('Data being sent:', data); // Debugging-Statement
    return this.http.post<any>(`${this.apiUrl}/calculate`, data, options);
  }

  // Generate PDF from the server
  downloadPDF(): Observable<Blob> {
    const options = {
      responseType: 'blob' as 'blob', 
      withCredentials: true, 
    };
  
    return this.http.post<Blob>(`${this.apiUrl}/generate_pdf`, {}, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
      responseType: 'blob' as 'json',
      withCredentials: true,
    });
    
  }
}
