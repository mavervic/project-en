import json

FILE = 'c:/Users/sunse/Documents/vscode-workspace/practice-side-project/project-en/app/data/parker/parkerQuestions.json'
with open(FILE, 'r', encoding='utf-8') as f:
    qs = json.load(f)

fixed = 0
for q in qs:
    clean_chunks = []
    for c in q['chunks']:
        t = c['text'].strip()
        if t in ('.', '?', '!', ','):
            # merge into previous chunk
            if clean_chunks:
                clean_chunks[-1]['text'] += t
            fixed += 1
        elif t.startswith('.'):
            c['text'] = t.lstrip('. ').strip()
            clean_chunks.append(c)
            fixed += 1
        else:
            clean_chunks.append(c)
    q['chunks'] = clean_chunks
    # re-find targetSlotIndex
    for idx, c in enumerate(q['chunks']):
        if c.get('isTargetSlot'):
            q['targetSlotIndex'] = idx
            break

print(f"Fixed {fixed} chunks.")

# Verify again
bad = 0
for q in qs:
    for c in q['chunks']:
        if c['text'].startswith('.') or c['text'] in ('.', '?', '!', ','):
            bad += 1
            print(f"Still bad in {q['id']}: {c['text']}")

print(f"Remaining bad chunks: {bad}")

with open(FILE, 'w', encoding='utf-8') as f:
    json.dump(qs, f, indent=2, ensure_ascii=False)
print("Saved cleanly.")
