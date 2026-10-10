// Redirect SEMUA SDK Firebase ke Emulator Suite lokal (host sama dengan
// firebase.json di root repo: Auth 9099, Firestore 8080, Functions 5001,
// Storage 9199). TIDAK ADA jalur production di sini sama sekali -- project
// Firebase production belum dibuat (lihat firebase_options.dart).
//
// `10.0.2.2` dipakai khusus emulator Android (alias loopback host dari
// dalam VM Android) -- `localhost`/`127.0.0.1` dipakai platform lain
// (iOS Simulator, macOS, web) yang berbagi jaringan loopback host.
import 'dart:io' show Platform;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

String get _emulatorHost {
  if (kIsWeb) return 'localhost';
  try {
    return Platform.isAndroid ? '10.0.2.2' : 'localhost';
  } catch (_) {
    return 'localhost';
  }
}

void connectToFirebaseEmulators() {
  final host = _emulatorHost;
  FirebaseAuth.instance.useAuthEmulator(host, 9099);
  FirebaseFirestore.instance.useFirestoreEmulator(host, 8080);
  FirebaseFunctions.instanceFor(region: 'asia-southeast2').useFunctionsEmulator(host, 5001);
  FirebaseStorage.instance.useStorageEmulator(host, 9199);
}
