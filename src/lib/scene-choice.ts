import { asset } from '@/lib/paths'
import { backdropFile, SCENES, type SceneMeta } from '@/lib/scenes'

/*
 * Which painted scene sits behind the site (components/scenes). The scene
 * boxes offer a few; the visitor's pick is kept in localStorage and put on
 * <html> as data-scene by a head script before paint, and CSS maps that
 * attribute to the picture, so a returning visitor's scene is there from the
 * first frame.
 */

/** A scene and the variant of it to show. */
export type SceneChoice = { scene: string; variant: string }

/** The scene boxes, in order; the first is the default. TODO(design): Marc's four from /prototypes/guide. */
export const BACKDROP_SCENES: SceneChoice[] = [
  { scene: 'flower-field', variant: 'day' },
  { scene: 'coast-road', variant: 'day' },
  { scene: 'horizon', variant: 'dusk' },
  { scene: 'reef', variant: 'day' },
]

/** The localStorage key that remembers the visitor's scene. */
export const SCENE_KEY = 'mal-scene'

/** What data-scene holds for a choice: "flower-field-day". */
export const choiceId = (choice: SceneChoice) => `${choice.scene}-${choice.variant}`

export const DEFAULT_SCENE_ID = choiceId(BACKDROP_SCENES[0])

/** Every scene and variant, so one picked in the lab shows on the site too. */
export const ALL_CHOICES: (SceneChoice & { id: string; meta: SceneMeta })[] = SCENES.flatMap((meta) =>
  meta.variants.map((variant) => ({ scene: meta.id, variant, id: `${meta.id}-${variant}`, meta })),
)

export const choiceMeta = (id: string) => ALL_CHOICES.find((c) => c.id === id)

/** The picture for a choice, and where to keep in frame when it's cropped (the scene's focus). */
export function choiceLook(choice: SceneChoice & { meta?: SceneMeta }) {
  const meta = choice.meta ?? SCENES.find((s) => s.id === choice.scene)
  const [fx, fy] = meta?.focus ?? [0.5, 0.5]
  return { src: asset(backdropFile(choice.scene, choice.variant)), position: `${Math.round(fx * 100)}% ${Math.round(fy * 100)}%` }
}

/** CSS mapping each data-scene to its picture, with the default on :root. Set in the document head. */
export function sceneRules() {
  const rule = (selector: string, choice: (typeof ALL_CHOICES)[number]) => {
    const { src, position } = choiceLook(choice)
    return `${selector}{--bd-src:url("${src}");--bd-pos:${position}}`
  }
  return ALL_CHOICES.map((choice) => rule(choice.id === DEFAULT_SCENE_ID ? `:root,html[data-scene="${choice.id}"]` : `html[data-scene="${choice.id}"]`, choice)).join('')
}

/** Runs in the document head before paint: puts the visitor's saved scene on <html>. */
export const sceneInitScript = () => `try {
  var scene = localStorage.getItem(${JSON.stringify(SCENE_KEY)});
  if (scene && ${JSON.stringify(ALL_CHOICES.map((c) => c.id))}.indexOf(scene) > -1) document.documentElement.dataset.scene = scene;
} catch (e) {}`
