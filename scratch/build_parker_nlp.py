import json
import os
import re
import spacy

nlp = spacy.load("en_core_web_sm")

OUTPUT_FILE = "c:/Users/sunse/Documents/vscode-workspace/practice-side-project/project-en/app/data/parker/parkerQuestions.json"

def clean_sentence(raw: str) -> str:
    raw = re.sub(r'\[Music\]', '', raw, flags=re.IGNORECASE)
    raw = re.sub(r'\[Applause\]', '', raw, flags=re.IGNORECASE)
    raw = re.sub(r'\s+', ' ', raw).strip()
    return raw

def extract_single_sentence(text):
    text = clean_sentence(text)
    words = text.split()
    if not words:
        return ""
    
    n = len(words)
    # Check 3-split first
    for chunk_len in range(3, n // 2 + 1):
        c1 = words[:chunk_len]
        c2 = words[chunk_len:2*chunk_len]
        if c1 == c2:
            return " ".join(c1)
            
    # Check 2-split
    for chunk_len in range(n // 2, 2, -1):
        c1 = words[:chunk_len]
        c2 = words[chunk_len:2*chunk_len]
        if c1 == c2:
            return " ".join(c1)

    first_word = words[0].lower()
    for i in range(3, n):
        if words[i].lower() == first_word:
            if len(words) >= 2*i:
                sim = sum(1 for a, b in zip(words[:i], words[i:2*i]) if a.lower() == b.lower())
                if sim >= i - 1:
                    return " ".join(words[:i])
            else:
                return " ".join(words[:i])
                
    return " ".join(words[:16]) if len(words) > 16 else " ".join(words)

def parse_with_spacy(sentence: str, training_id: str, q_idx: int):
    sentence = sentence.strip()
    if not sentence:
        return None
    sentence = sentence[0].upper() + sentence[1:]
    if not sentence.endswith(('.', '?', '!')):
        sentence += '.'

    doc = nlp(sentence)
    if len(doc) < 3:
        return None

    subj_token = None
    verb_token = None

    # Find the primary subject
    for token in doc:
        if token.dep_ in ('nsubj', 'nsubjpass'):
            subj_token = token
            verb_token = token.head
            break

    if not subj_token or not verb_token:
        for token in doc:
            if token.pos_ in ('VERB', 'AUX') and token.dep_ == 'ROOT':
                verb_token = token
                break

    if not verb_token:
        return None

    # Collect verb phrase tokens
    verb_tokens = [verb_token]
    for child in verb_token.children:
        if child.dep_ in ('aux', 'auxpass', 'neg', 'prt') and child != subj_token:
            verb_tokens.append(child)
            for subchild in child.children:
                if subchild.dep_ in ('neg', 'prt'):
                    verb_tokens.append(subchild)

    verb_tokens = sorted(verb_tokens, key=lambda t: t.i)

    # Check for inverted questions (subject is between aux and main verb)
    lead_clause_text = ""
    subj_text = ""
    verb_text = ""

    if subj_token:
        subj_subtree = sorted([t for t in subj_token.subtree if t not in verb_tokens], key=lambda t: t.i)
        if subj_subtree:
            first_s = subj_subtree[0]
            last_s = subj_subtree[-1]
            s_start = first_s.idx
            s_end = last_s.idx + len(last_s.text)
            subj_text = sentence[s_start:s_end].strip()

            # Is subject before verb or inverted?
            if s_end <= verb_tokens[0].idx:
                # Normal order: Subject before Verb
                if s_start > 0:
                    lead_clause_text = sentence[:s_start].strip().rstrip(', ')
                v_start = verb_tokens[0].idx
                v_end = verb_tokens[-1].idx + len(verb_tokens[-1].text)
                verb_text = sentence[v_start:v_end].strip()
                rest_raw = sentence[v_end:].strip()
            else:
                # Inverted question e.g. "Where is the grand opening going to take place?"
                # lead_clause: "Where is" or "Where"
                aux_before = [t for t in verb_tokens if t.i < first_s.i]
                v_after = [t for t in verb_tokens if t.i > last_s.i]
                
                if s_start > 0:
                    lead_clause_text = sentence[:s_start].strip().rstrip(', ')
                
                if v_after:
                    v_start = v_after[0].idx
                    v_end = v_after[-1].idx + len(v_after[-1].text)
                    verb_text = sentence[v_start:v_end].strip()
                    rest_raw = sentence[v_end:].strip()
                else:
                    verb_text = verb_tokens[-1].text
                    rest_raw = sentence[verb_tokens[-1].idx + len(verb_tokens[-1].text):].strip()
        else:
            subj_text = subj_token.text
            v_start = verb_tokens[0].idx
            v_end = verb_tokens[-1].idx + len(verb_tokens[-1].text)
            verb_text = sentence[v_start:v_end].strip()
            rest_raw = sentence[v_end:].strip()
    else:
        subj_text = "The subject"
        v_start = verb_tokens[0].idx
        v_end = verb_tokens[-1].idx + len(verb_tokens[-1].text)
        verb_text = sentence[v_start:v_end].strip()
        rest_raw = sentence[v_end:].strip()

    if not subj_text:
        subj_text = "The subject"
    if not verb_text:
        verb_text = verb_token.text

    # Assemble Chunks - NEVER allow leading '.' or standalone punctuation
    chunks = []
    if lead_clause_text and lead_clause_text not in ('.', '?', '!', ','):
        chunks.append({ "text": lead_clause_text, "isTargetSlot": False, "type": "clause" })
    
    chunks.append({ "text": subj_text, "isTargetSlot": False, "type": "subject" })
    chunks.append({ "text": verb_text, "isTargetSlot": True, "type": "verb" })

    # Clean rest_raw
    rest_clean = rest_raw.lstrip(',.?! ').strip()
    # Check ending punctuation of the sentence
    end_punct = sentence[-1] if sentence[-1] in ('.', '?', '!') else '.'

    if rest_clean:
        # Split rest_clean on prepositions or subordinate conjunctions if long (> 8 words)
        words_rest = rest_clean.split()
        if len(words_rest) > 8:
            prep_m = re.search(r'(\b(?:by|with|at|in|on|to|from|for|during|before|after|because|when)\b)', rest_clean, flags=re.IGNORECASE)
            if prep_m and prep_m.start() > 2:
                p1 = rest_clean[:prep_m.start()].strip().rstrip(',. ')
                p2 = rest_clean[prep_m.start():].strip()
                if p1:
                    chunks.append({ "text": p1, "isTargetSlot": False, "type": "object" })
                if p2:
                    if not p2.endswith(('.', '?', '!')):
                        p2 += end_punct
                    chunks.append({ "text": p2, "isTargetSlot": False, "type": "clause" })
            else:
                if not rest_clean.endswith(('.', '?', '!')):
                    rest_clean += end_punct
                chunks.append({ "text": rest_clean, "isTargetSlot": False, "type": "clause" })
        else:
            if not rest_clean.endswith(('.', '?', '!')):
                rest_clean += end_punct
            chunks.append({ "text": rest_clean, "isTargetSlot": False, "type": "clause" })
    else:
        # Attach punctuation to verb chunk if no rest
        if not chunks[-1]["text"].endswith(('.', '?', '!')):
            chunks[-1]["text"] += end_punct

    # Voice / Time / Aspect calculation
    lower_s = sentence.lower()
    lower_v = verb_text.lower()

    # Voice
    voice = 'active'
    if any(t.dep_ == 'auxpass' for t in verb_tokens) or any(t.dep_ == 'nsubjpass' for t in doc):
        voice = 'passive'
    elif any(pat in lower_s for pat in ['is loaded', 'are loaded', 'was loaded', 'were loaded', 'being loaded', 'been loaded', 'was delayed', 'were delayed', 'were encrypted', 'was encrypted', 'will be conducted', 'been distributed', 'were replaced']):
        voice = 'passive'

    # Time
    time_val = 'present'
    if any(w in lower_v for w in ['will', 'shall', "'ll", 'going to']) or 'will ' in lower_s:
        time_val = 'future'
    elif any(w in lower_v for w in ['was', 'were', 'had', 'did']) or any(t.tag_ == 'VBD' for t in verb_tokens) or any(w in lower_s for w in ['yesterday', 'last year', 'delayed', 'encrypted']):
        if not any(w in lower_v for w in ['will', 'shall']):
            time_val = 'past'
    else:
        time_val = 'present'

    # Aspect
    aspect = 'simple'
    if any(t.tag_ == 'VBG' for t in verb_tokens) or 'being' in lower_v or 'watering' in lower_v or 'leaning' in lower_v or 'testing' in lower_v or 'boarding' in lower_v:
        aspect = 'continuous'
    elif any(w in lower_v for w in ['has', 'have', 'had']) and (any(t.tag_ == 'VBN' for t in verb_tokens) or any(w in lower_v for w in ['been', 'organized', 'distributed', 'verified', 'changed'])):
        aspect = 'perfect'

    aspect_zh = "進行式" if aspect == "continuous" else ("完成式" if aspect == "perfect" else "簡單式")
    time_zh = "過去" if time_val == "past" else ("未來" if time_val == "future" else "現在")
    voice_zh = "被動語態" if voice == "passive" else "主動語態"
    grammar_note = f"「{verb_text}」為{time_zh}{aspect_zh}{voice_zh} ({time_val.capitalize()} {aspect.capitalize()} {voice.capitalize()})。主詞為「{subj_text}」。"

    target_slot_index = next(i for i, c in enumerate(chunks) if c["isTargetSlot"])

    return {
        "id": f"{training_id}-q{q_idx:02d}",
        "sentence": sentence,
        "chunks": chunks,
        "targetSlotIndex": target_slot_index,
        "correctAnswers": {
            "voice": voice,
            "time": time_val,
            "aspect": aspect
        },
        "grammarNote": grammar_note,
        "trainingId": training_id
    }

def main():
    print("Loading existing questions and re-processing with SpaCy dependency parsing...")
    with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
        existing = json.load(f)

    print(f"Loaded {len(existing)} questions.")
    
    updated_questions = []
    cleaned_count = 0

    for q in existing:
        raw_sentence = q["sentence"]
        t_id = q["trainingId"]
        # extract index from id e.g. parker-01-q03 -> 3
        m = re.search(r'q(\d+)', q["id"])
        q_idx = int(m.group(1)) if m else 1

        new_q = parse_with_spacy(raw_sentence, t_id, q_idx)
        if new_q:
            # Check sanity: no chunks should start with '.' or be empty
            valid = True
            for c in new_q["chunks"]:
                if not c["text"].strip() or c["text"].strip() in ('.', '?', '!'):
                    valid = False
                    break
                if c["text"].startswith('.'):
                    c["text"] = c["text"].lstrip('. ').strip()

            if valid and len(new_q["chunks"]) >= 2:
                updated_questions.append(new_q)
                cleaned_count += 1
            else:
                updated_questions.append(q)
        else:
            updated_questions.append(q)

    print(f"Successfully re-processed {cleaned_count} questions with SpaCy.")
    
    # Verify no chunks start with '.' across entire dataset
    bad_chunks = 0
    for q in updated_questions:
        for c in q["chunks"]:
            if c["text"].startswith('.') or c["text"] == '.':
                bad_chunks += 1

    print(f"Dataset validation: bad '.' chunks count = {bad_chunks}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(updated_questions, f, indent=2, ensure_ascii=False)
    print(f"Saved cleaned dataset to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
