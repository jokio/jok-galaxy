using System.Web;
using System.Web.Optimization;

namespace Jok.Galaxy
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Scripts/js").Include(
                        "~/Scripts/jquery-{version}.js",
                        "~/Scripts/bootstrap.js",
                        "~/Scripts/respond.js"
                        ));

            bundles.Add(new ScriptBundle("~/Scripts/Game/js").Include(
                        "~/Scripts/Game/oz.js",
                        "~/Scripts/Game/haf.js",
                        "~/Scripts/Game/game.js",
                        "~/Scripts/Game/game.client.js",
                        "~/Scripts/Game/game.single.js",
                        "~/Scripts/Game/game.multi.js",
                        "~/Scripts/Game/game.server.js",
                        "~/Scripts/Game/audio.js",
                        "~/Scripts/Game/keyboard.js",
                        "~/Scripts/Game/player.js",
                        "~/Scripts/Game/player.ai.js",
                        "~/Scripts/Game/player.human.js",
                        "~/Scripts/Game/ship.js",
                        "~/Scripts/Game/ship.mini.js",
                        "~/Scripts/Game/background.js",
                        "~/Scripts/Game/map.js",
                        "~/Scripts/Game/explosion.js",
                        "~/Scripts/Game/weapon.js",
                        "~/Scripts/Game/weapon.projectile.js",
                        "~/Scripts/Game/label.js",
                        "~/Scripts/Game/score.js",
                        "~/Scripts/Game/preloadjs-0.2.0.js",
                        "~/Scripts/Game/start.js"
                        ));


            bundles.Add(new StyleBundle("~/Styles/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css"
                      ));
        }
    }
}
