<%@ WebHandler Language="C#" Class="abc" %>

using System;
using System.Web;

public class abc : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "text/plain";
           
        context.Response.Write("你查找的是："+context.Request.QueryString["keyword"]);
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}