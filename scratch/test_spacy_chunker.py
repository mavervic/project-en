import spacy

nlp = spacy.load("en_core_web_sm")

def chunk_with_spacy(sentence: str, training_id: str, q_idx: int):
    sentence = sentence.strip()
    if not sentence.endswith(('.', '?', '!')):
        sentence += '.'

    doc = nlp(sentence)
    if len(doc) < 3:
        return None

    # Find the main subject and verb
    subj_token = None
    verb_token = None

    # First, look for nsubj / nsubjpass
    for token in doc:
        if token.dep_ in ('nsubj', 'nsubjpass'):
            subj_token = token
            verb_token = token.head
            break

    # If no nsubj, look for ROOT verb or pron
    if not subj_token or not verb_token:
        for token in doc:
            if token.pos_ in ('VERB', 'AUX') and token.dep_ == 'ROOT':
                verb_token = token
                break

    if not verb_token:
        return None

    # Determine verb group tokens
    verb_tokens = [verb_token]
    for child in verb_token.children:
        if child.dep_ in ('aux', 'auxpass', 'neg', 'prt') and child != subj_token:
            verb_tokens.append(child)
            # check if aux has children (e.g. negation)
            for subchild in child.children:
                if subchild.dep_ in ('neg', 'prt'):
                    verb_tokens.append(subchild)

    verb_tokens = sorted(verb_tokens, key=lambda t: t.i)
    v_start_idx = verb_tokens[0].idx
    v_end_idx = verb_tokens[-1].idx + len(verb_tokens[-1].text)
    verb_text = sentence[v_start_idx:v_end_idx].strip()

    # Determine subject constituent
    lead_clause_text = ""
    subj_text = ""
    if subj_token:
        subj_subtree = sorted([t for t in subj_token.subtree if t.i < verb_tokens[0].i], key=lambda t: t.i)
        if subj_subtree:
            # Check if there are tokens before the subject subtree (e.g. "If", "Because")
            first_subj_idx = subj_subtree[0].idx
            if first_subj_idx > 0:
                lead_clause_text = sentence[:first_subj_idx].strip()
            
            last_subj_token = subj_subtree[-1]
            subj_end_idx = last_subj_token.idx + len(last_subj_token.text)
            subj_text = sentence[first_subj_idx:subj_end_idx].strip()
        else:
            subj_text = subj_token.text
    else:
        # Implicit or imperative subject
        subj_text = sentence[:v_start_idx].strip() or "The subject"

    rest_text = sentence[v_end_idx:].strip()

    # Strip any standalone punctuation from rest_text if it's only punctuation
    # and attach sentence ending punctuation properly
    chunks = []
    if lead_clause_text:
        chunks.append({ "text": lead_clause_text, "isTargetSlot": False, "type": "clause" })
    
    if subj_text:
        chunks.append({ "text": subj_text, "isTargetSlot": False, "type": "subject" })
        
    chunks.append({ "text": verb_text, "isTargetSlot": True, "type": "verb" })

    if rest_text:
        # If rest_text is just punct like ".", merge into verb or previous chunk
        if rest_text in ('.', '?', '!'):
            chunks[-1]["text"] += rest_text
        else:
            # Split rest_text into natural chunks (by prepositions or clauses if long)
            # Make sure no chunk starts with "."
            rest_text = rest_text.lstrip('. ')
            if rest_text:
                chunks.append({ "text": rest_text, "isTargetSlot": False, "type": "clause" })

    # Voice / Time / Aspect detection
    lower = sentence.lower()
    lower_v = verb_text.lower()

    voice = 'active'
    if any(t.dep_ == 'auxpass' for t in verb_tokens) or any(t.dep_ == 'nsubjpass' for t in doc):
        voice = 'passive'
    elif any(aux in lower_v for aux in ['is being', 'are being', 'was being', 'were being', 'been', 'be ']):
        if any(lower_v.endswith(sfx) for sfx in ['ed', 'en', 'loaded', 'assembled', 'installed', 'built', 'held', 'done', 'made', 'repaired', 'conducted', 'encrypted']):
            voice = 'passive'

    time_val = 'present'
    if any(w in lower_v for w in ['will', 'shall', "'ll", 'going to']):
        time_val = 'future'
    elif any(w in lower_v for w in ['was', 'were', 'had', 'did']) or any(t.tag_ in ('VBD', 'VBN') and t.dep_ == 'ROOT' for t in verb_tokens):
        time_val = 'past'
    else:
        time_val = 'present'

    aspect = 'simple'
    if any(t.tag_ == 'VBG' for t in verb_tokens) or 'being' in lower_v:
        aspect = 'continuous'
    elif any(t.tag_ == 'VBN' for t in verb_tokens) and any(w in lower_v for w in ['has', 'have', 'had']):
        aspect = 'perfect'

    # Grammar note
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

# Test on key examples
test_cases = [
    "If the first presenter doesn't show up within the next 10 minutes.",
    "A woman is watering plants.",
    "Where is the grand opening going to take place.",
    "The boat is being loaded with cargo.",
    "Because the flight was delayed, our client rescheduled the meeting.",
    "All confidential client records were encrypted by the IT security department yesterday."
]

import json
for i, tc in enumerate(test_cases, 1):
    q = chunk_with_spacy(tc, "parker-test", i)
    print(f"\n--- Test {i}: {tc} ---")
    print(json.dumps(q, indent=2, ensure_ascii=False))
