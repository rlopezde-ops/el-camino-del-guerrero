# Asset Pipeline — Voxel Art Style Guide

## MagicaVoxel Workflow

### Setup
1. Download [MagicaVoxel](https://ephtracy.github.io/) (free, works on Mac/Windows)
2. Set canvas to 16x16x16 for characters, 32x32x16 for environments

### Character Style Rules
- **Proportions:** Head is 6-8 voxels wide, body is 5-6 voxels wide. Oversized head ratio (~1.5:1 head:body)
- **Palette:** Use the Crossy Road palette — 4-6 colors per character max. Skin, gi (white), belt (color), hair, shoes
- **No outlines:** The voxel edges create their own form
- **Eyes:** 1-2 dark voxels per eye, placed on the front face of the head
- **Belt:** A single row of colored voxels around the waist area

### Palette (hex values matching the app)
| Belt   | Color   |
|--------|---------|
| White  | #f5f5f5 |
| Yellow | #fbbf24 |
| Orange | #f97316 |
| Green  | #22c55e |
| Blue   | #3b82f6 |
| Purple | #a855f7 |
| Brown  | #92400e |
| Red    | #dc2626 |
| Black  | #1f2937 |
| Gold accent | #f59e0b |
| Skin 1 | #fde2b3 |
| Skin 2 | #d4a574 |
| Skin 3 | #8d5524 |
| Gi white | #f0f0f0 |
| Wood   | #8b6914 |

### Export
- **For 3D (React Three Fiber):** Export as GLTF/GLB → place in `public/models/`
- **For 2D sprites:** Render → export PNG at 2x → place in `public/sprites/`

### AI-Assisted Generation
1. Use VoxiGen (browser-based) for quick base models
2. Use image AI for concept art reference sheets
3. Always refine in MagicaVoxel for palette and proportion consistency

## File Structure
```
public/
  audio/
    sensei/        # Sensei voice clips (MP3)
    vocab/         # Vocabulary pronunciations (MP3)
    instructions/  # Exercise instruction phrases (MP3)
    sfx/           # Sound effects (MP3)
  models/          # GLTF/GLB voxel models
  sprites/         # 2D sprite sheets (PNG)
```
