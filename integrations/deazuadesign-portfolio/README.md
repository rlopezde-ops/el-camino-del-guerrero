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

4. **If the deploy fails with “Not Found”** when checking out the Spanish repo: your Spanish repo is almost certainly **private**. GitHub hides private repos from the default token, so it looks like “not found.”  
   - **Fix A (easy):** On `el-camino-del-guerrero` → **Settings** → **General** → scroll to **Danger zone** → **Change repository visibility** → **Public** (only if you’re okay with that).  
   - **Fix B (keep private):** On `deazuadesign-portfolio` → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → name **`SPANISH_REPO_TOKEN`**, value = a [fine-grained PAT](https://github.com/settings/personal-access-tokens) with **Contents: Read** on `el-camino-del-guerrero` only. Then re-run the workflow (**Actions** → failed run → **Re-run all jobs**).

### If the workflow is “stuck” or never finishes

The job uses the **`github-pages` environment**. The first time, GitHub may wait for you to **approve** it:

1. Open **`deazuadesign-portfolio`** → **Actions** → click the yellow “**Waiting for approval**” banner (or the pending job).
2. Click **Review deployments** → **Approve** (you must be allowed to deploy to that environment).

### After we change this workflow in the Spanish repo

Copy the file again from  
`el-camino-del-guerrero` → `integrations/deazuadesign-portfolio/deploy-github-pages.yml`  
into  
`deazuadesign-portfolio` → `.github/workflows/deploy-github-pages.yml`,  
then commit on the portfolio repo.

## Optional: turn off the separate Spanish-only Pages site

If you no longer want **https://rlopezde-ops.github.io/el-camino-del-guerrero/**, remove or disable **Settings → Pages** on that repo and delete `.github/workflows/deploy.yml` there.
