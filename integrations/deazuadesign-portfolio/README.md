# Host Spanish app under the portfolio (`/apps/spanish`)

Live URL after setup:

**https://rlopezde-ops.github.io/deazuadesign-portfolio/apps/spanish/**

## One-time setup (GitHub)

1. Copy the workflow file into your portfolio repo:

   ```bash
   # From your machine, with both repos cloned:
   mkdir -p deazuadesign-portfolio/.github/workflows
   cp spanish-kids-ipad/integrations/deazuadesign-portfolio/deploy-github-pages.yml \
      deazuadesign-portfolio/.github/workflows/deploy-github-pages.yml
   ```

2. In **deazuadesign-portfolio** on GitHub: **Settings → Pages → Build and deployment → Source** → choose **GitHub Actions** (not “Deploy from a branch”).

3. Push the new workflow to `main` on `deazuadesign-portfolio`. The workflow will build the Spanish app from `rlopezde-ops/el-camino-del-guerrero` and publish it under `apps/spanish/`.

4. If `el-camino-del-guerrero` is **private**, add a repository secret on `deazuadesign-portfolio` named `SPANISH_REPO_TOKEN` (fine-grained PAT with read access to that repo). The workflow uses it automatically when present.

## Optional: turn off the separate Spanish-only Pages site

If you no longer want **https://rlopezde-ops.github.io/el-camino-del-guerrero/**, remove or disable **Settings → Pages** on that repo and delete `.github/workflows/deploy.yml` there.
