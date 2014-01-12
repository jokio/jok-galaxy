using Jok.GameEngine;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jok.Galaxy.Controllers
{
    public class HomeController : GameControllerBase
    {
        #region Properties
        protected override string AuthorizationUrl
        {
            get { return ConfigurationManager.AppSettings["LoginUrl"] + "?returnUrl=" + Request.Url; }
        }

        protected override string ExitUrl
        {
            get { return ConfigurationManager.AppSettings["ExitUrl"]; }
        }

        protected override int ConnectionsCount
        {
            get { return 0; }
        }

        protected override int TablesCount
        {
            get { return 0; }
        }
        #endregion

        public override ActionResult Play(string id, string sid, string source)
        {
            var result = base.Play(id, sid, source);

            if (!String.IsNullOrEmpty(sid))
            {
                return RedirectToAction("Play", new { id = id, source = source });
            }

            var userInfo = JokAPI.GetUser(ViewBag.SID as string, Request.UserHostAddress);

            ViewBag.PlayerNick = userInfo.Nick;

            return result;
        }
    }
}