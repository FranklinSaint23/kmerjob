import 'server-only'

import { extractText, getDocumentProxy } from 'unpdf'

/**
 * Extraction du texte d'un fichier de CV.
 *
 * Limite connue et assumée : un PDF scanné (photo de CV, très courant ici) ne
 * contient aucune couche texte. Aucune bibliothèque d'extraction n'y changera
 * quoi que ce soit — il faudrait de l'OCR. Plutôt que de renvoyer une chaîne
 * vide qui produirait un profil vide et un score de 0 sans explication, on
 * détecte le cas et on le remonte explicitement à l'appelant, qui pourra
 * proposer la saisie manuelle.
 */

export type ExtractionStatus = 'ok' | 'empty' | 'unsupported'

export interface TextExtractionResult {
  text: string
  status: ExtractionStatus
  pages: number
  /** Message destiné à l'utilisateur, déjà en français. */
  message?: string
}

/** Seuil sous lequel on considère qu'aucune couche texte exploitable n'existe. */
const MIN_USABLE_CHARS = 120

export async function extractTextFromFile(
  file: File | Blob,
  fileName: string
): Promise<TextExtractionResult> {
  const extension = fileName.toLowerCase().split('.').pop() ?? ''

  if (extension === 'txt') {
    const text = cleanup(await file.text())
    return text.length >= MIN_USABLE_CHARS
      ? { text, status: 'ok', pages: 1 }
      : {
          text,
          status: 'empty',
          pages: 1,
          message: 'Le fichier est trop court pour être analysé.',
        }
  }

  if (extension === 'pdf') return extractFromPdf(file)

  return {
    text: '',
    status: 'unsupported',
    pages: 0,
    message:
      "Format non pris en charge pour l'analyse automatique. Dépose un PDF ou un fichier texte, ou saisis ton profil manuellement.",
  }
}

async function extractFromPdf(file: File | Blob): Promise<TextExtractionResult> {
  try {
    const buffer = new Uint8Array(await file.arrayBuffer())
    const pdf = await getDocumentProxy(buffer)
    const { text, totalPages } = await extractText(pdf, { mergePages: true })

    const cleaned = cleanup(Array.isArray(text) ? text.join('\n') : text)

    if (cleaned.length < MIN_USABLE_CHARS) {
      return {
        text: cleaned,
        status: 'empty',
        pages: totalPages,
        message:
          "Ce PDF ne contient pas de texte sélectionnable — il s'agit probablement d'un scan ou d'une photo. Saisis ton profil manuellement pour obtenir des recommandations.",
      }
    }

    return { text: cleaned, status: 'ok', pages: totalPages }
  } catch (error) {
    return {
      text: '',
      status: 'unsupported',
      pages: 0,
      message: `Impossible de lire ce PDF (${error instanceof Error ? error.message : 'fichier illisible'}). Essaie de le réenregistrer ou dépose un autre format.`,
    }
  }
}

/**
 * Les extracteurs PDF produisent des césures et des espaces parasites qui
 * cassent la reconnaissance de mots-clés en aval : « déve loppeur » ne matchera
 * jamais « développeur ».
 */
function cleanup(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/-\n(?=[a-zà-ÿ])/gi, '') // recolle les mots coupés en fin de ligne
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
