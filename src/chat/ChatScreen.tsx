import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrawnHeader } from '@/components/BrawnHeader';
import { useAuth } from '@/auth/AuthProvider';
import { apiRequest } from '@/api/client';
import { colors } from '@/theme/colors';
import { radii } from '@/theme/spacing';

type Counterpart = { id:string; firstName:string; lastName:string; type:'MEMBER'|'STAFF'; role?:string; roleCategory?:string; memberNumber?:string };
type Conversation = { id:string; memberId:string; staffId:string; updatedAt:string; lastMessage:string|null; lastMessageAt:string|null; unreadCount:number; counterpart:Counterpart };
type Message = { id:string; senderType:'MEMBER'|'STAFF'; senderId:string; body:string; readAt:string|null; createdAt:string };
type SearchResult = {
  id:string;
  firstName:string;
  lastName:string;
  type:'MEMBER'|'STAFF';
  employeeNumber?:string;
  memberNumber?:string;
  roleName?:string;
  roleCategory?:string;
};

export function ChatScreen() {
  const { user } = useAuth();
  const isMember = user?.userType === 'MEMBER' || Boolean(user?.memberId);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [active,setActive]=useState<Conversation|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [draft,setDraft]=useState('');
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState('');
  const [search,setSearch]=useState('');
  const [results,setResults]=useState<SearchResult[]>([]);
  const [searching,setSearching]=useState(false);
  const [startingId,setStartingId]=useState<string|null>(null);

  const loadConversations=useCallback(async()=>{
    setConversations(await apiRequest<Conversation[]>('/mobile-auth/chat/conversations'));
  },[]);

  const loadBase=useCallback(async()=>{
    setError('');
    try{await loadConversations();}
    catch(caught){setError(caught instanceof Error?caught.message:'Unable to load chat.');}
    finally{setLoading(false);}
  },[loadConversations]);

  const loadMessages=useCallback(async(conversationId:string)=>{
    try{
      const rows=await apiRequest<Message[]>(`/mobile-auth/chat/conversations/${conversationId}/messages`);
      setMessages(rows);
      await apiRequest(`/mobile-auth/chat/conversations/${conversationId}/read`,{method:'POST'});
    }catch(caught){setError(caught instanceof Error?caught.message:'Unable to load messages.');}
  },[]);

  useFocusEffect(useCallback(()=>{
    setLoading(true); void loadBase();
    const timer=setInterval(()=>{void loadConversations(); if(active) void loadMessages(active.id);},5000);
    return()=>clearInterval(timer);
  },[active,loadBase,loadConversations,loadMessages]));

  useEffect(()=>{if(active) void loadMessages(active.id); else setMessages([]);},[active,loadMessages]);

  useEffect(()=>{
    const term=search.trim();
    if(!term){setResults([]);setSearching(false);return;}
    let cancelled=false;
    const timer=setTimeout(async()=>{
      setSearching(true);
      try{
        const rows=await apiRequest<SearchResult[]>(`/mobile-auth/chat/search?q=${encodeURIComponent(term)}`);
        if(!cancelled)setResults(rows);
      }catch(caught){if(!cancelled)setError(caught instanceof Error?caught.message:'Unable to search people.');}
      finally{if(!cancelled)setSearching(false);}
    },250);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[search]);

  const visibleResults=useMemo(()=>results.slice(0,30),[results]);

  async function openOrStart(person:SearchResult){
    setStartingId(person.id); setError('');
    try{
      const existing=conversations.find(row=>row.counterpart.id===person.id && row.counterpart.type===person.type);
      if(existing){setActive(existing);setSearch('');setResults([]);return;}
      const body=person.type==='STAFF'?{staffId:person.id}:{memberId:person.id};
      const result=await apiRequest<{id:string}>('/mobile-auth/chat/conversations',{method:'POST',body:JSON.stringify(body)});
      const rows=await apiRequest<Conversation[]>('/mobile-auth/chat/conversations');
      setConversations(rows);
      const next=rows.find(row=>row.id===result.id);
      if(next){setActive(next);setSearch('');setResults([]);}
    }catch(caught){setError(caught instanceof Error?caught.message:'Unable to start conversation.');}
    finally{setStartingId(null);}
  }

  async function send(){
    if(!active||!draft.trim()||sending)return;
    const body=draft.trim(); setDraft(''); setSending(true); setError('');
    try{
      const message=await apiRequest<Message>(`/mobile-auth/chat/conversations/${active.id}/messages`,{method:'POST',body:JSON.stringify({body})});
      setMessages(old=>[...old,message]); await loadConversations();
    }catch(caught){setDraft(body);setError(caught instanceof Error?caught.message:'Unable to send message.');}
    finally{setSending(false);}
  }

  if(active){
    const name=`${active.counterpart.firstName} ${active.counterpart.lastName}`.trim();
    return <Screen><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={styles.flex}>
      <View style={styles.threadHeader}>
        <Pressable onPress={()=>setActive(null)} style={styles.backButton}><Ionicons name="chevron-back" size={22} color={colors.foreground}/></Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>{`${active.counterpart.firstName[0]??''}${active.counterpart.lastName[0]??''}`.toUpperCase()}</Text></View>
        <View style={styles.flex}><Text style={styles.threadName}>{name}</Text><Text style={styles.threadRole}>{active.counterpart.role??active.counterpart.memberNumber??'Brawn chat'}</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
        {messages.length===0?<Text style={styles.emptyText}>No messages yet. Start the conversation.</Text>:null}
        {messages.map(message=>{const mine=isMember?message.senderType==='MEMBER':message.senderType==='STAFF';return <View key={message.id} style={[styles.bubbleRow,mine&&styles.bubbleRowMine]}><View style={[styles.bubble,mine?styles.bubbleMine:styles.bubbleOther]}><Text style={[styles.messageText,mine&&styles.messageTextMine]}>{message.body}</Text><Text style={[styles.messageTime,mine&&styles.messageTimeMine]}>{new Date(message.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text></View></View>;})}
      </ScrollView>
      {error?<Text style={styles.threadError}>{error}</Text>:null}
      <View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Message…" placeholderTextColor={colors.mutedDark} multiline maxLength={2000} style={styles.input}/><Pressable onPress={send} disabled={!draft.trim()||sending} style={[styles.sendButton,(!draft.trim()||sending)&&styles.sendDisabled]}>{sending?<ActivityIndicator color="#fff" size="small"/>:<Ionicons name="send" size={18} color="#fff"/>}</Pressable></View>
    </KeyboardAvoidingView></Screen>;
  }

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <BrawnHeader label={isMember?'MEMBER':'TRAINER'}/><Text style={styles.kicker}>DIRECT MESSAGES</Text><Text style={styles.title}>Chat</Text>
    <Text style={styles.subtitle}>{isMember?'Search for a trainer or staff member in your gym and start a conversation.':'Search for a client in your gym and start a conversation.'}</Text>

    <View style={styles.searchWrap}>
      <Ionicons name="search" size={18} color={colors.muted} />
      <TextInput
        value={search}
        onChangeText={value=>{setSearch(value);if(error)setError('');}}
        placeholder={isMember?'Search trainer or staff name…':'Search member name…'}
        placeholderTextColor={colors.mutedDark}
        autoCorrect={false}
        autoCapitalize="words"
        style={styles.searchInput}
      />
      {searching?<ActivityIndicator size="small" color={colors.accent}/>:search?<Pressable onPress={()=>{setSearch('');setResults([]);}}><Ionicons name="close-circle" size={18} color={colors.muted}/></Pressable>:null}
    </View>

    {search.trim()?<View style={styles.searchPanel}>
      {searching&&visibleResults.length===0?<View style={styles.searchState}><Text style={styles.searchStateText}>Searching…</Text></View>:null}
      {!searching&&visibleResults.length===0?<View style={styles.searchState}><Text style={styles.searchStateText}>No matching people found.</Text></View>:null}
      {visibleResults.length>0?<ScrollView style={styles.resultScroll} nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
        {visibleResults.map(person=>{
          const meta=person.type==='STAFF'?(person.roleName??person.roleCategory??person.employeeNumber??'Staff'):(person.memberNumber??'Member');
          return <Pressable key={`${person.type}-${person.id}`} onPress={()=>void openOrStart(person)} disabled={startingId===person.id} style={styles.resultRow}>
            <View style={styles.avatarSmall}><Text style={styles.avatarText}>{`${person.firstName[0]??''}${person.lastName[0]??''}`.toUpperCase()}</Text></View>
            <View style={styles.personBody}><Text style={styles.personName}>{person.firstName} {person.lastName}</Text><Text style={styles.personRole}>{meta}</Text></View>
            {startingId===person.id?<ActivityIndicator size="small" color={colors.accent}/>:<Ionicons name="chatbubble-outline" size={18} color={colors.accent}/>} 
          </Pressable>;
        })}
      </ScrollView>:null}
    </View>:null}

    {loading?<View style={styles.loading}><ActivityIndicator color={colors.accent}/></View>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {!loading&&conversations.length>0?<Text style={styles.sectionLabel}>CONVERSATIONS</Text>:null}
    {conversations.map(conversation=>{const name=`${conversation.counterpart.firstName} ${conversation.counterpart.lastName}`.trim();return <Pressable key={conversation.id} onPress={()=>setActive(conversation)} style={styles.personRow}><View style={styles.avatar}><Text style={styles.avatarText}>{`${conversation.counterpart.firstName[0]??''}${conversation.counterpart.lastName[0]??''}`.toUpperCase()}</Text></View><View style={styles.personBody}><View style={styles.personTop}><Text style={styles.personName}>{name}</Text>{conversation.unreadCount>0?<View style={styles.badge}><Text style={styles.badgeText}>{conversation.unreadCount}</Text></View>:null}</View><Text style={styles.personRole}>{conversation.counterpart.role??conversation.counterpart.memberNumber??''}</Text><Text numberOfLines={1} style={styles.preview}>{conversation.lastMessage??'Start chatting'}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.mutedDark}/></Pressable>;})}
    {!loading&&conversations.length===0&&!search.trim()?<View style={styles.emptyCard}><Ionicons name="chatbubbles-outline" size={28} color={colors.muted}/><Text style={styles.emptyTitle}>No chats yet</Text><Text style={styles.emptyText}>Use the search bar above to find someone and start your first conversation.</Text></View>:null}
  </ScrollView></Screen>;
}

const styles=StyleSheet.create({
  flex:{flex:1},content:{paddingHorizontal:20,paddingTop:12,paddingBottom:36},kicker:{color:colors.accent,fontSize:10,fontWeight:'900',letterSpacing:2,marginTop:38},title:{color:colors.foreground,fontSize:32,fontWeight:'900',letterSpacing:-1,marginTop:5},subtitle:{color:colors.muted,fontSize:12,lineHeight:18,marginTop:7,marginBottom:18},loading:{paddingVertical:50},error:{color:colors.danger,fontSize:11,marginTop:10,marginBottom:2},threadError:{color:colors.danger,fontSize:11,marginHorizontal:16,marginBottom:8},sectionLabel:{color:colors.muted,fontSize:9,fontWeight:'900',letterSpacing:1.7,marginTop:22,marginBottom:9},searchWrap:{height:50,borderWidth:1,borderColor:colors.line,borderRadius:15,backgroundColor:'#0d0f0e',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:10},searchInput:{flex:1,color:colors.foreground,fontSize:14,paddingVertical:0},searchPanel:{marginTop:8,borderWidth:1,borderColor:colors.line,borderRadius:15,backgroundColor:'#0b0d0c',overflow:'hidden'},resultScroll:{maxHeight:270},resultRow:{minHeight:62,paddingHorizontal:12,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:11,borderBottomWidth:1,borderBottomColor:colors.line},searchState:{padding:18,alignItems:'center'},searchStateText:{color:colors.muted,fontSize:11},avatarSmall:{width:38,height:38,borderRadius:12,backgroundColor:'rgba(255,59,59,.08)',borderWidth:1,borderColor:'rgba(255,59,59,.22)',alignItems:'center',justifyContent:'center'},personRow:{minHeight:78,borderWidth:1,borderColor:colors.line,borderRadius:radii.lg,backgroundColor:'#0d0f0e',padding:12,flexDirection:'row',alignItems:'center',gap:12,marginBottom:9},avatar:{width:44,height:44,borderRadius:14,backgroundColor:'rgba(255,59,59,.08)',borderWidth:1,borderColor:'rgba(255,59,59,.22)',alignItems:'center',justifyContent:'center'},avatarText:{color:colors.accent,fontSize:13,fontWeight:'900'},personBody:{flex:1,minWidth:0},personTop:{flexDirection:'row',alignItems:'center',gap:8},personName:{color:colors.foreground,fontSize:14,fontWeight:'800'},personRole:{color:colors.accent,fontSize:9,fontWeight:'800',marginTop:3},preview:{color:colors.muted,fontSize:10,marginTop:5},badge:{minWidth:20,height:20,borderRadius:10,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center',paddingHorizontal:5},badgeText:{color:'#fff',fontSize:9,fontWeight:'900'},emptyCard:{borderWidth:1,borderColor:colors.line,borderRadius:radii.lg,padding:28,alignItems:'center',marginTop:18},emptyTitle:{color:colors.foreground,fontSize:15,fontWeight:'800',marginTop:10},emptyText:{color:colors.muted,fontSize:11,lineHeight:17,textAlign:'center',marginTop:6},threadHeader:{height:74,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:colors.line,flexDirection:'row',alignItems:'center',gap:11},backButton:{width:34,height:34,alignItems:'center',justifyContent:'center'},threadName:{color:colors.foreground,fontSize:14,fontWeight:'800'},threadRole:{color:colors.muted,fontSize:10,marginTop:2},messages:{flexGrow:1,padding:16,paddingBottom:24},bubbleRow:{flexDirection:'row',justifyContent:'flex-start',marginBottom:9},bubbleRowMine:{justifyContent:'flex-end'},bubble:{maxWidth:'78%',borderRadius:18,paddingHorizontal:13,paddingVertical:9},bubbleOther:{backgroundColor:'#171a17',borderWidth:1,borderColor:colors.line},bubbleMine:{backgroundColor:colors.accent},messageText:{color:colors.foreground,fontSize:13,lineHeight:18},messageTextMine:{color:'#fff'},messageTime:{color:colors.mutedDark,fontSize:8,marginTop:5},messageTimeMine:{color:'rgba(255,255,255,.7)',textAlign:'right'},composer:{borderTopWidth:1,borderTopColor:colors.line,padding:12,flexDirection:'row',alignItems:'flex-end',gap:9,backgroundColor:'#0d0f0e'},input:{flex:1,maxHeight:110,minHeight:44,borderWidth:1,borderColor:colors.line,borderRadius:16,paddingHorizontal:13,paddingTop:11,paddingBottom:11,color:colors.foreground,backgroundColor:'#111311',fontSize:13},sendButton:{width:44,height:44,borderRadius:14,backgroundColor:colors.accent,alignItems:'center',justifyContent:'center'},sendDisabled:{opacity:.45}
});
