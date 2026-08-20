# Correct GitHub import

The repository must preserve the monorepo directory structure. Do not upload all files as one flat list through a file picker.

## Recommended: Git CLI

1. Clone the existing repository:

```bash
git clone https://github.com/FlavorPilot/FlavorPilot.git
cd FlavorPilot
```

2. Copy the complete contents of the extracted `flavorpilot` directory into the cloned repository. Include hidden files and directories such as `.github`, `.gitignore`, `.npmrc`, `.env.example`, and `.dockerignore`. Do not replace the cloned `.git` directory.

3. Verify the expected structure:

```text
apps/
  web/
  api/
packages/
  contracts/
  flavor-engine/
docs/
scripts/
supabase/
.github/
package.json
```

4. Commit and push:

```bash
git add .
git commit -m "feat: initialize FlavorPilot monorepo"
git push origin main
```

5. Run the dependency-free check:

```bash
npm run validate:structure
```

Expected result: all checks pass.

## Windows PowerShell copy command

Assuming the archive is extracted to `C:\Temp\flavorpilot` and the cloned repository is `C:\Projects\FlavorPilot`:

```powershell
Get-ChildItem -Force "C:\Temp\flavorpilot" |
  Where-Object { $_.Name -ne ".git" } |
  Copy-Item -Destination "C:\Projects\FlavorPilot" -Recurse -Force
```

Then run the Git commands from `C:\Projects\FlavorPilot`.
