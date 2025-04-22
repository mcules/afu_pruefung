import React, {useState, useEffect, useRef, useMemo} from "react";
import katex from "katex";

interface Question {
    number: string;
    class: string;
    question: string;
    answer_a: string;
    answer_b: string;
    answer_c: string;
    answer_d: string;
    picture_question?: string;
    picture_a?: string;
    picture_b?: string;
    picture_c?: string;
    picture_d?: string;
}

interface Section {
    title: string;
    questions?: Question[];
    sections?: Section[];
}

interface ShuffledQuestion extends Omit<Question, "answer_a" | "answer_b" | "answer_c" | "answer_d"> {
    categoryPath: string[];
    answers: { id: string; text: string; isCorrect: boolean }[];
}

interface ExamPartConfig {
    label: string;
    count: number;
    filter: (q: ShuffledQuestion) => boolean;
    durationMin: number;
}

interface ExamQuestion {
    partLabel: string;
    question: ShuffledQuestion;
}

const Card = ({children}: { children: React.ReactNode }) => (
    <div
        style={{
            background: "white",
            borderRadius: 8,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            padding: 16,
            marginBottom: 16,
        }}
    >
        {children}
    </div>
);

const Button = (
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & { style?: React.CSSProperties }
) => (
    <button
        {...props}
        style={{
            display: "block",
            width: "100%",
            padding: "8px 16px",
            marginBottom: 8,
            borderRadius: 4,
            textAlign: "left",
            border: "none",
            cursor: props.disabled ? "default" : "pointer",
            ...(props.style || {}),
        }}
    />
);

function shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => Math.random() - 0.5);
}

function shuffleAnswers(
    q: Question & { categoryPath: string[] }
): ShuffledQuestion {
    const options = [
        {id: "A", text: q.answer_a, isCorrect: true},
        {id: "B", text: q.answer_b, isCorrect: false},
        {id: "C", text: q.answer_c, isCorrect: false},
        {id: "D", text: q.answer_d, isCorrect: false},
    ];
    return {...q, answers: shuffleArray(options)};
}

const renderMath = (text: string): React.ReactNode => {
    const regexInline = /\$(.*?)\$/g;
    const regexBlock = /\$\$(.*?)\$\$/g;

    text = text.replace(regexInline, (_, match) => {
        try {
            return katex.renderToString(match, {throwOnError: false});
        } catch (error) {
            return `<span style="color: red;">LaTeX-Fehler: ${error.message}</span>`;
        }
    });

    text = text.replace(regexBlock, (_, match) => {
        try {
            return katex.renderToString(match, {displayMode: true, throwOnError: false});
        } catch (error) {
            return `<span style="color: red;">LaTeX-Fehler: ${error.message}</span>`;
        }
    });

    return <div dangerouslySetInnerHTML={{__html: text}}/>;
};

export default function App() {
    const [questions, setQuestions] = useState<ShuffledQuestion[]>([]);
    const [mode, setMode] = useState<
        "lernmodus" | "setup" | "simulation" | "partSummary" | "result"
    >("lernmodus");
    const [examType, setExamType] = useState<string>("N");
    const [simQuestions, setSimQuestions] = useState<ExamQuestion[][]>([]);
    const [partIndex, setPartIndex] = useState(0);
    const [qIndex, setQIndex] = useState(0);
    const [selected, setSelected] = useState<string | null>(null);
    const [showSolution, setShowSolution] = useState(false);
    const [results, setResults] = useState<boolean[][]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [lernIndex, setLernIndex] = useState(0);

    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedAnswer, setSelectedAnswer] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch("/fragenkatalog3b.json")
            .then((res) => res.json())
            .then((data: { sections: Section[] }) => {
                function extract(secs: Section[], path: string[] = []): (Question & { categoryPath: string[] })[] {
                    let list: any[] = [];
                    secs.forEach((sec) => {
                        const p = [...path, sec.title];
                        if (sec.questions) list.push(...sec.questions.map((q) => ({...q, categoryPath: p})));
                        if (sec.sections) list.push(...extract(sec.sections, p));
                    });
                    return list;
                }

                setQuestions(extract(data.sections).map(shuffleAnswers as any));
            });
    }, []);

    const filteredQuestions = useMemo(() => {
        return questions.filter((q) => {
            const matchesCategory = selectedCategory ? q.categoryPath.includes(selectedCategory) : true;
            const matchesClass = selectedClass ? q.class === selectedClass : true;
            return matchesCategory && matchesClass;
        });
    }, [questions, selectedCategory, selectedClass]);

    const handleAnswerCheck = (question: ShuffledQuestion, answerId: string) => {
        setSelectedAnswer((prev) => ({
            ...prev,
            [question.number]: answerId,
        }));
    };

    const examConfig: Record<string, ExamPartConfig[]> = {
        N: [
            {
                label: "Vorschriften (V)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Vorschriften")),
                durationMin: 45,
            },
            {
                label: "Betriebliche Kenntnisse (B)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Betriebliche Kenntnisse")),
                durationMin: 45,
            },
            {
                label: "Technik N (N)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "1",
                durationMin: 45,
            },
        ],
        E: [
            {
                label: "Vorschriften (V)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Vorschriften")),
                durationMin: 45,
            },
            {
                label: "Betriebliche Kenntnisse (B)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Betriebliche Kenntnisse")),
                durationMin: 45,
            },
            {
                label: "Technik N (N)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "1",
                durationMin: 45,
            },
            {
                label: "Technik E (E)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "2",
                durationMin: 45,
            },
        ],
        A: [
            {
                label: "Vorschriften (V)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Vorschriften")),
                durationMin: 45,
            },
            {
                label: "Betriebliche Kenntnisse (B)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Betriebliche Kenntnisse")),
                durationMin: 45,
            },
            {
                label: "Technik N (N)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "1",
                durationMin: 45,
            },
            {
                label: "Technik E (E)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "2",
                durationMin: 45,
            },
            {
                label: "Technik A (A)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "3",
                durationMin: 60,
            },
        ],
        "N->E": [
            {
                label: "Technik E (E)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "2",
                durationMin: 45,
            },
        ],
        "N->A": [
            {
                label: "Technik E (E)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "2",
                durationMin: 45,
            },
            {
                label: "Technik A (A)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "3",
                durationMin: 60,
            },
        ],
        "E->A": [
            {
                label: "Technik A (A)",
                count: 25,
                filter: (q) => q.categoryPath.some((p) => p.includes("Technische Kenntnisse")) && q.class === "3",
                durationMin: 60,
            },
        ],
    };

    const enterSetup = () => {
        setMode("setup");
        setResults([]);
    };

    const startSimulation = () => {
        const parts = examConfig[examType];
        const pools = parts.map((part) => {
            const pool = shuffleArray(questions.filter(part.filter));
            const sel = pool.slice(0, part.count);
            while (sel.length < part.count && pool.length) sel.push(pool[sel.length % pool.length]);
            return sel.map((q) => ({partLabel: part.label, question: q}));
        });
        setSimQuestions(pools);
        setResults(pools.map(() => []));
        setPartIndex(0);
        setQIndex(0);
        setSelected(null);
        setShowSolution(false);
        setMode("simulation");
        setTimeLeft(parts[0].durationMin * 60);
    };

    useEffect(() => {
        if (mode !== "simulation") return;
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTimeLeft((t) => (t > 1 ? t - 1 : (handleNext(), 0))), 1000);
        return () => timerRef.current && clearInterval(timerRef.current);
    }, [mode, partIndex]);

    const handleResolve = () => {
        if (!selected) return;
        const correct = simQuestions[partIndex][qIndex].question.answers.find((a) => a.id === selected)?.isCorrect || false;
        setResults((r) => {
            const c = r.map((arr) => [...arr]);
            c[partIndex].push(correct);
            return c;
        });
        setShowSolution(true);
    };

    const handleNext = () => {
        if (qIndex + 1 < simQuestions[partIndex].length) {
            setQIndex((i) => i + 1);
            setSelected(null);
            setShowSolution(false);
        } else {
            setMode("partSummary");
        }
    };

    const handleContinue = () => {
        const next = partIndex + 1;
        if (next < simQuestions.length) {
            setPartIndex(next);
            setQIndex(0);
            setSelected(null);
            setShowSolution(false);
            setMode("simulation");
            setTimeLeft(examConfig[examType][next].durationMin * 60);
        } else {
            setMode("result");
            timerRef.current && clearInterval(timerRef.current);
        }
    };

    const current = mode === "simulation" ? simQuestions[partIndex][qIndex] : undefined;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    const getIndentedCategories = () => {
        const categoriesMap = new Map<string, number>();

        questions.forEach((q) => {
            q.categoryPath.forEach((_, idx, path) => {
                const category = path.slice(0, idx + 1).join(" > ");
                categoriesMap.set(category, idx);
            });
        });

        return Array.from(categoriesMap.entries()).map(([category, depth]) => ({
            value: category.split(" > ").pop(),
            label: category,
            depth,
        }));
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: 900,
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
                overflowY: "auto"
            }}
        >
            <div style={{display: "flex", gap: 8, marginBottom: 16}}>
                <button
                    onClick={() => {
                        setMode("lernmodus");
                        setSimQuestions([]);
                    }}
                    style={{flex: 1}}
                >
                    Lernmodus
                </button>
                <button onClick={enterSetup} style={{flex: 1}}>
                    Prüfungssimulation
                </button>
            </div>
            {(mode === "setup" || mode === "simulation" || mode === "partSummary") && (
                <Card>
                    <h3 style={{color: "#000", marginBottom: 8}}>Einstellungen</h3>
                    <div style={{display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 16}}>
                        <div style={{display: "flex", alignItems: "center", gap: 8}}>
                            <div style={{color: "#000", fontWeight: "bold"}}>Prüfungstyp</div>
                            {mode === "setup" ? (
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value)}
                                    style={{padding: "4px"}}
                                >
                                    {Object.keys(examConfig).map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{color: "#000"}}>{examType}</div>
                            )}
                        </div>
                        {mode === "setup" && (
                            <div style={{alignSelf: "end"}}>
                                <button onClick={startSimulation} style={{width: "100%", padding: "8px"}}>
                                    Start
                                </button>
                            </div>
                        )}
                    </div>
                    <Card>
                        {examConfig[examType].map((part, idx) => {
                            const res = results[idx] || [];
                            const passed =
                                res.length === part.count &&
                                res.filter((x) => x).length / part.count >= 0.75;
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        marginBottom: 4,
                                        color: "#000",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        {part.label}: {part.count} Fragen ({part.durationMin} Min.)
                                    </div>
                                    {res.length === part.count && (
                                        <div
                                            style={{
                                                fontWeight: "bold",
                                                color: passed ? "#38a169" : "#e53e3e",
                                            }}
                                        >
                                            {passed ? "Bestanden" : "Nicht bestanden"}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Card>
                </Card>
            )}
            {mode === "simulation" && current && (
                <Card>
                    <div style={{display: "flex", justifyContent: "space-between", marginBottom: 8}}>
                        <h2 style={{color: "#000", fontSize: 18, fontWeight: "bold"}}>
                            {current.question.number} - {current.partLabel}
                        </h2>
                        <div style={{color: "#000", fontWeight: "bold"}}>
                            {minutes.toString().padStart(2, "0")}:
                            {seconds.toString().padStart(2, "0")}
                        </div>
                    </div>
                    <h3 style={{color: "#000", marginBottom: 8}}>
                        Frage {qIndex + 1} / {simQuestions[partIndex].length}
                    </h3>
                    {/* Anzeige der Frage mit Bild */}
                    <div style={{color: "#000", marginBottom: 16}}>
                        {renderMath(current.question.question)}
                        {current.question.picture_question && (
                            <img
                                src={`/svgs/${current.question.picture_question}.svg`}
                                alt="Frage-Bild"
                                style={{maxWidth: "100%", marginTop: 8}}
                            />
                        )}
                    </div>
                    {current.question.answers.map((opt, index) => (
                        <Button
                            key={opt.id}
                            disabled={showSolution}
                            onClick={() => setSelected(opt.id)}
                            style={{
                                backgroundColor: !showSolution
                                    ? opt.id === selected
                                        ? "#2c5282"
                                        : "#3182ce"
                                    : opt.isCorrect
                                        ? "#38a169"
                                        : opt.id === selected
                                            ? "#e53e3e"
                                            : "#3182ce",
                                color: "white",
                            }}
                        >
                            {/* Kennzeichnung mit A:, B:, C:, D: */}
                            {`${String.fromCharCode(65 + index)}:`} {/* ASCII-Wert für A, B, C, D */}
                            {renderMath(opt.text)}
                            {current.question[`picture_${opt.id.toLowerCase()}`] && (
                                <div>
                                    {/* Vor dem Bild das Label anzeigen */}
                                    <span style={{marginRight: 8}}>{opt.id.toLowerCase()}</span>
                                    <img
                                        src={`/svgs/${current.question[`picture_${opt.id.toLowerCase()}`]}.svg`}
                                        alt={`Antwort-${opt.id}-Bild`}
                                        style={{maxWidth: "100%", marginTop: 8}}
                                    />
                                </div>
                            )}
                        </Button>
                    ))}
                    {!showSolution ? (
                        <button
                            onClick={handleResolve}
                            disabled={!selected}
                            style={{marginTop: 8, width: "100%", padding: 8}}
                        >
                            Auflösen
                        </button>
                    ) : (
                        <div style={{marginTop: 16}}>
                            {current.question.answers.find((a) => a.id === selected)?.isCorrect ? (
                                <p style={{color: "#38a169"}}>Richtig!</p>
                            ) : (
                                <p style={{color: "#e53e3e"}}>Leider falsch.</p>
                            )}
                            <button
                                onClick={handleNext}
                                style={{marginTop: 8, width: "100%", padding: 8}}
                            >
                                Weiter zur Auswertung
                            </button>
                        </div>
                    )}
                </Card>
            )}
            {mode === "partSummary" && (
                <Card>
                    <h2 style={{color: "#000", fontSize: 18, fontWeight: "bold"}}>
                        Auswertung {examConfig[examType][partIndex].label}
                    </h2>
                    <p style={{color: "#000"}}>
                        Richtig: {results[partIndex].filter((x) => x).length} / {simQuestions[partIndex].length}
                    </p>
                    <button
                        onClick={handleContinue}
                        style={{marginTop: 16, width: "100%", padding: 8}}
                    >
                        Weiter
                    </button>
                </Card>
            )}
            {mode === "result" && (
                <Card>
                    <h2 style={{color: "#000", fontSize: 18, fontWeight: "bold"}}>Endergebnis</h2>
                    {simQuestions.map((_, i) => {
                        const corr = results[i].filter((x) => x).length;
                        return (
                            <p key={i} style={{color: "#000"}}>
                                {examConfig[examType][i].label}: {corr} / {_.length} (
                                {Math.round((corr / _.length) * 100)}%)
                            </p>
                        );
                    })}
                </Card>
            )}
            {mode === "lernmodus" && (
                <Card>
                    <h3 style={{color: "#000", marginBottom: 8}}>Lernmodus</h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            marginBottom: 16,
                        }}
                    >
                        <div style={{display: "flex", alignItems: "center", gap: 8}}>
                            <div style={{color: "#000", fontWeight: "bold"}}>Kategorie</div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setLernIndex(0);
                                }}
                                style={{padding: "4px"}}
                            >
                                <option value="">Alle Kategorien</option>
                                {getIndentedCategories().map((category) => (
                                    <option key={category.label} value={category.value}>
                                        {"\u00A0".repeat(category.depth * 4) + category.value}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{display: "flex", alignItems: "center", gap: 8}}>
                            <div style={{color: "#000", fontWeight: "bold"}}>Klasse</div>
                            <select
                                value={selectedClass}
                                onChange={(e) => {
                                    setSelectedClass(e.target.value);
                                    setLernIndex(0);
                                }}
                                style={{padding: "4px"}}
                            >
                                <option value="">Alle Klassen</option>
                                {Array.from(new Set(questions.map((q) => q.class))).map((cls) => (
                                    <option key={cls} value={cls}>
                                        {cls}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        {filteredQuestions.length > 0 ? (
                            <>
                                <Card key={filteredQuestions[lernIndex].number} style={{marginBottom: 8}}>
                                    <h3 style={{color: "#000", marginBottom: 8}}>
                                        {filteredQuestions[lernIndex].number}:
                                    </h3>
                                    <div style={{color: "#000", marginBottom: 8}}>
                                        {renderMath(filteredQuestions[lernIndex].question)}
                                        {filteredQuestions[lernIndex].picture_question && (
                                            <img
                                                src={`/svgs/${filteredQuestions[lernIndex].picture_question}.svg`}
                                                alt="Frage-Bild"
                                                style={{maxWidth: "100%", marginTop: 8}}
                                            />
                                        )}
                                    </div>
                                    {filteredQuestions[lernIndex].answers.map((opt, index) => (
                                        <Button
                                            key={opt.id}
                                            onClick={() => handleAnswerCheck(filteredQuestions[lernIndex], opt.id)}
                                            style={{
                                                backgroundColor:
                                                    selectedAnswer[filteredQuestions[lernIndex].number] === opt.id
                                                        ? opt.isCorrect
                                                            ? "#38a169"
                                                            : "#e53e3e"
                                                        : "#3182ce",
                                                color: "white",
                                                whiteSpace: "normal",
                                                lineHeight: "1.2",
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: "8px",
                                                justifyContent: "flex-start",
                                            }}
                                        >
                                            <span
                                                style={{fontWeight: "bold"}}>{`${String.fromCharCode(65 + index)}:`}</span>
                                            {renderMath(opt.text)}
                                            {filteredQuestions[lernIndex][`picture_${opt.id.toLowerCase()}`] && (
                                                <img
                                                    src={`/svgs/${filteredQuestions[lernIndex][`picture_${opt.id.toLowerCase()}`]}.svg`}
                                                    alt={`Antwort-${opt.id}-Bild`}
                                                    style={{maxWidth: "100%", marginTop: 8}}
                                                />
                                            )}
                                        </Button>
                                    ))}
                                    {selectedAnswer[filteredQuestions[lernIndex].number] && (
                                        <p style={{color: "#000", marginTop: 8}}>
                                            {filteredQuestions[lernIndex].answers.find(
                                                (a) => a.id === selectedAnswer[filteredQuestions[lernIndex].number]
                                            )?.isCorrect
                                                ? "Richtig!"
                                                : "Leider falsch."}
                                        </p>
                                    )}
                                </Card>
                                <button
                                    style={{width: "100%", padding: 8}}
                                    onClick={() => {
                                        setSelectedAnswer({});
                                        setLernIndex((prev) => (prev + 1) % filteredQuestions.length);
                                    }}
                                >
                                    Nächste Frage
                                </button>
                            </>
                        ) : (
                            <p style={{color: "#000"}}>Keine Fragen gefunden.</p>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}