--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

-- Started on 2025-07-28 17:05:22 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.code_snippets DROP CONSTRAINT IF EXISTS code_snippets_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public."Document" DROP CONSTRAINT IF EXISTS "Document_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public."CodeSnippet" DROP CONSTRAINT IF EXISTS "CodeSnippet_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public."ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_projectId_fkey";
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.events DROP CONSTRAINT IF EXISTS events_pkey;
ALTER TABLE IF EXISTS ONLY public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
ALTER TABLE IF EXISTS ONLY public.code_snippets DROP CONSTRAINT IF EXISTS code_snippets_pkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_pkey;
ALTER TABLE IF EXISTS ONLY public."Project" DROP CONSTRAINT IF EXISTS "Project_pkey";
ALTER TABLE IF EXISTS ONLY public."Event" DROP CONSTRAINT IF EXISTS "Event_pkey";
ALTER TABLE IF EXISTS ONLY public."Document" DROP CONSTRAINT IF EXISTS "Document_pkey";
ALTER TABLE IF EXISTS ONLY public."CodeSnippet" DROP CONSTRAINT IF EXISTS "CodeSnippet_pkey";
ALTER TABLE IF EXISTS ONLY public."ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_pkey";
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.events ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.documents ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.code_snippets ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chats ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.projects_id_seq;
DROP TABLE IF EXISTS public.projects;
DROP SEQUENCE IF EXISTS public.messages_id_seq;
DROP TABLE IF EXISTS public.messages;
DROP SEQUENCE IF EXISTS public.events_id_seq;
DROP TABLE IF EXISTS public.events;
DROP SEQUENCE IF EXISTS public.documents_id_seq;
DROP TABLE IF EXISTS public.documents;
DROP SEQUENCE IF EXISTS public.code_snippets_id_seq;
DROP TABLE IF EXISTS public.code_snippets;
DROP SEQUENCE IF EXISTS public.chats_id_seq;
DROP TABLE IF EXISTS public.chats;
DROP TABLE IF EXISTS public."Project";
DROP TABLE IF EXISTS public."Event";
DROP TABLE IF EXISTS public."Document";
DROP TABLE IF EXISTS public."CodeSnippet";
DROP TABLE IF EXISTS public."ChatMessage";
DROP TYPE IF EXISTS public.user_role;
--
-- TOC entry 873 (class 1247 OID 73881)
-- Name: user_role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'user'
);


ALTER TYPE public.user_role OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 73737)
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ChatMessage" (
    id text NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "projectId" text NOT NULL
);


ALTER TABLE public."ChatMessage" OWNER TO neondb_owner;

--
-- TOC entry 218 (class 1259 OID 73753)
-- Name: CodeSnippet; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."CodeSnippet" (
    id text NOT NULL,
    filename text NOT NULL,
    code text NOT NULL,
    language text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "projectId" text NOT NULL
);


ALTER TABLE public."CodeSnippet" OWNER TO neondb_owner;

--
-- TOC entry 217 (class 1259 OID 73745)
-- Name: Document; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    content text NOT NULL,
    format text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "projectId" text NOT NULL
);


ALTER TABLE public."Document" OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 73871)
-- Name: Event; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    date timestamp(3) without time zone NOT NULL,
    "time" text,
    reminder boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text
);


ALTER TABLE public."Event" OWNER TO neondb_owner;

--
-- TOC entry 215 (class 1259 OID 73729)
-- Name: Project; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text
);


ALTER TABLE public."Project" OWNER TO neondb_owner;

--
-- TOC entry 229 (class 1259 OID 73946)
-- Name: chats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) DEFAULT 'Nuova chat'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.chats OWNER TO neondb_owner;

--
-- TOC entry 228 (class 1259 OID 73945)
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chats_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3460 (class 0 OID 0)
-- Dependencies: 228
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- TOC entry 225 (class 1259 OID 73914)
-- Name: code_snippets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.code_snippets (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    language character varying(50) NOT NULL,
    code text NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.code_snippets OWNER TO neondb_owner;

--
-- TOC entry 224 (class 1259 OID 73913)
-- Name: code_snippets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.code_snippets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.code_snippets_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3461 (class 0 OID 0)
-- Dependencies: 224
-- Name: code_snippets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.code_snippets_id_seq OWNED BY public.code_snippets.id;


--
-- TOC entry 223 (class 1259 OID 73899)
-- Name: documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    format character varying(50) NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.documents OWNER TO neondb_owner;

--
-- TOC entry 222 (class 1259 OID 73898)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3462 (class 0 OID 0)
-- Dependencies: 222
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 233 (class 1259 OID 81921)
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    date timestamp without time zone NOT NULL,
    type character varying(50) DEFAULT 'event'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.events OWNER TO neondb_owner;

--
-- TOC entry 232 (class 1259 OID 81920)
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.events_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3463 (class 0 OID 0)
-- Dependencies: 232
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- TOC entry 231 (class 1259 OID 73960)
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    chat_id integer,
    content text NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- TOC entry 230 (class 1259 OID 73959)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3464 (class 0 OID 0)
-- Dependencies: 230
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 227 (class 1259 OID 73929)
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    files text NOT NULL,
    thumbnail text,
    user_id integer,
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- TOC entry 226 (class 1259 OID 73928)
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3465 (class 0 OID 0)
-- Dependencies: 226
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- TOC entry 221 (class 1259 OID 73886)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 220 (class 1259 OID 73885)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3466 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 3250 (class 2604 OID 73949)
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- TOC entry 3244 (class 2604 OID 73917)
-- Name: code_snippets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.code_snippets ALTER COLUMN id SET DEFAULT nextval('public.code_snippets_id_seq'::regclass);


--
-- TOC entry 3242 (class 2604 OID 73902)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 3255 (class 2604 OID 81924)
-- Name: events id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- TOC entry 3253 (class 2604 OID 73963)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 3246 (class 2604 OID 73932)
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- TOC entry 3239 (class 2604 OID 73889)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3437 (class 0 OID 73737)
-- Dependencies: 216
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."ChatMessage" (id, role, content, "createdAt", "projectId") FROM stdin;
msg-1	user	Hello, can you help me with React components?	2025-06-05 11:08:08.327	demo-proj-1
msg-2	ai	Of course! I can help you create React components. What specific component are you looking to build?	2025-06-05 11:08:08.327	demo-proj-1
msg-3	user	I need a button component with different variants	2025-06-05 11:08:08.327	demo-proj-1
msg-4	ai	Here is a flexible Button component with multiple variants...	2025-06-05 11:08:08.327	demo-proj-1
\.


--
-- TOC entry 3439 (class 0 OID 73753)
-- Dependencies: 218
-- Data for Name: CodeSnippet; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."CodeSnippet" (id, filename, code, language, "createdAt", "projectId") FROM stdin;
code-1	Button.tsx	import React from "react";\\n\\ninterface ButtonProps {\\n  variant: "primary" | "secondary";\\n  children: React.ReactNode;\\n  onClick?: () => void;\\n}\\n\\nexport const Button: React.FC<ButtonProps> = ({ variant, children, onClick }) => {\\n  const baseClasses = "px-4 py-2 rounded font-medium";\\n  const variantClasses = variant === "primary" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800";\\n  \\n  return (\\n    <button className={`${baseClasses} ${variantClasses}`} onClick={onClick}>\\n      {children}\\n    </button>\\n  );\\n};	typescript	2025-06-05 11:08:43.614	demo-proj-3
code-2	utils.ts	export const formatDate = (date: Date): string => {\\n  return new Intl.DateTimeFormat("en-US", {\\n    year: "numeric",\\n    month: "long",\\n    day: "numeric"\\n  }).format(date);\\n};\\n\\nexport const debounce = <T extends (...args: any[]) => any>(\\n  func: T,\\n  delay: number\\n): (...args: Parameters<T>) => void => {\\n  let timeoutId: NodeJS.Timeout;\\n  return (...args: Parameters<T>) => {\\n    clearTimeout(timeoutId);\\n    timeoutId = setTimeout(() => func(...args), delay);\\n  };\\n};	typescript	2025-06-05 11:08:43.614	demo-proj-3
\.


--
-- TOC entry 3438 (class 0 OID 73745)
-- Dependencies: 217
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Document" (id, content, format, "createdAt", "projectId") FROM stdin;
doc-1	This is a comprehensive project documentation that includes all requirements, specifications, and implementation details for the AI-powered application.	pdf	2025-06-05 11:08:34.191	demo-proj-2
doc-2	User manual and installation guide for the application with step-by-step instructions.	word	2025-06-05 11:08:34.191	demo-proj-2
\.


--
-- TOC entry 3440 (class 0 OID 73871)
-- Dependencies: 219
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Event" (id, title, description, date, "time", reminder, "createdAt", "userId") FROM stdin;
\.


--
-- TOC entry 3436 (class 0 OID 73729)
-- Dependencies: 215
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public."Project" (id, name, type, "createdAt", "userId") FROM stdin;
demo-proj-1	AI Chat Demo	chat	2025-06-05 11:08:01.36	demo-user
demo-proj-2	Document Generator Demo	document	2025-06-05 11:08:01.36	demo-user
demo-proj-3	Code Generator Demo	code	2025-06-05 11:08:01.36	demo-user
\.


--
-- TOC entry 3450 (class 0 OID 73946)
-- Dependencies: 229
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.chats (id, user_id, title, created_at) FROM stdin;
\.


--
-- TOC entry 3446 (class 0 OID 73914)
-- Dependencies: 225
-- Data for Name: code_snippets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.code_snippets (id, title, language, code, user_id, created_at) FROM stdin;
\.


--
-- TOC entry 3444 (class 0 OID 73899)
-- Dependencies: 223
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.documents (id, title, content, format, user_id, created_at) FROM stdin;
\.


--
-- TOC entry 3454 (class 0 OID 81921)
-- Dependencies: 233
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.events (id, user_id, title, description, date, type, created_at, updated_at) FROM stdin;
1	demo-user	Riunione	Evento aggiunto tramite Nuvia il 09/06/2025	2025-06-10 16:00:00	meeting	2025-06-09 09:02:21.95508	2025-06-09 09:02:21.95508
2	demo-user	Riunione	Evento aggiunto tramite Nuvia il 17/06/2025	2025-06-18 04:00:00	meeting	2025-06-17 08:52:28.597229	2025-06-17 08:52:28.597229
3	demo-user	Riunione	Evento aggiunto tramite Nuvia il 28/07/2025	2025-07-29 07:00:00	meeting	2025-07-28 16:52:56.151411	2025-07-28 16:52:56.151411
\.


--
-- TOC entry 3452 (class 0 OID 73960)
-- Dependencies: 231
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, chat_id, content, role, created_at) FROM stdin;
\.


--
-- TOC entry 3448 (class 0 OID 73929)
-- Dependencies: 227
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, name, description, files, thumbnail, user_id, is_public, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3442 (class 0 OID 73886)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password, role, created_at) FROM stdin;
1	admin@example.com	$2b$10$XpvHf1sTYI9QxX1K.hBJM.ahDmQrE6yNuXQPZD1gk9I3bk5lZ9MmG	admin	2025-06-05 11:03:26.238322+00
\.


--
-- TOC entry 3467 (class 0 OID 0)
-- Dependencies: 228
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.chats_id_seq', 1, false);


--
-- TOC entry 3468 (class 0 OID 0)
-- Dependencies: 224
-- Name: code_snippets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.code_snippets_id_seq', 1, false);


--
-- TOC entry 3469 (class 0 OID 0)
-- Dependencies: 222
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.documents_id_seq', 1, false);


--
-- TOC entry 3470 (class 0 OID 0)
-- Dependencies: 232
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.events_id_seq', 3, true);


--
-- TOC entry 3471 (class 0 OID 0)
-- Dependencies: 230
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- TOC entry 3472 (class 0 OID 0)
-- Dependencies: 226
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- TOC entry 3473 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 3262 (class 2606 OID 73744)
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- TOC entry 3266 (class 2606 OID 73760)
-- Name: CodeSnippet CodeSnippet_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CodeSnippet"
    ADD CONSTRAINT "CodeSnippet_pkey" PRIMARY KEY (id);


--
-- TOC entry 3264 (class 2606 OID 73752)
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- TOC entry 3268 (class 2606 OID 73879)
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- TOC entry 3260 (class 2606 OID 73736)
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- TOC entry 3280 (class 2606 OID 73953)
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- TOC entry 3276 (class 2606 OID 73922)
-- Name: code_snippets code_snippets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.code_snippets
    ADD CONSTRAINT code_snippets_pkey PRIMARY KEY (id);


--
-- TOC entry 3274 (class 2606 OID 73907)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 3284 (class 2606 OID 81931)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 3282 (class 2606 OID 73968)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3278 (class 2606 OID 73939)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 3270 (class 2606 OID 73897)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3272 (class 2606 OID 73895)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3285 (class 2606 OID 73761)
-- Name: ChatMessage ChatMessage_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3287 (class 2606 OID 73771)
-- Name: CodeSnippet CodeSnippet_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."CodeSnippet"
    ADD CONSTRAINT "CodeSnippet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3286 (class 2606 OID 73766)
-- Name: Document Document_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3291 (class 2606 OID 73954)
-- Name: chats chats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3289 (class 2606 OID 73923)
-- Name: code_snippets code_snippets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.code_snippets
    ADD CONSTRAINT code_snippets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3288 (class 2606 OID 73908)
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3292 (class 2606 OID 73969)
-- Name: messages messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- TOC entry 3290 (class 2606 OID 73940)
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 2092 (class 826 OID 16392)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2091 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-07-28 17:05:29 UTC

--
-- PostgreSQL database dump complete
--

