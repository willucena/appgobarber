import React, { useCallback, useRef } from 'react';
import {
  Image,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert
}
from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import * as Yup from 'yup';

import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';

import { useAuth } from '../../hooks/auth'

import Input from '../../components/Input';
import Button from '../../components/Button';
import logoImg from '../../assets/logo.png';
import getValidationErrors from '../../utils/getValidationErrors';

import {
  Container,
  Title,
  ForgotPassword,
  ForgotPasswordText,
  CreateAccountButton,
  CreateAccountButtonText
} from './styles';

interface SignInFormData {
  email: string;
  password: string;
}
  const SignIn: React.FC = () => {
  const formRef = useRef<FormHandles>(null);
  const passwordInputyRef = useRef<TextInput>(null)
  const navigation = useNavigation();

  const { signIn } = useAuth();

  const handleSignIn = useCallback(
    async (data: SignInFormData) => {
      // Validando
      try {
        formRef.current?.setErrors({});
        const schema = Yup.object().shape({
          email: Yup.string()
            .required('E-mail obrigatório')
            .email('Email inválido'),
          password: Yup.string().required('Senha obrigatória'),
        });
        await schema.validate(data, {
          abortEarly: false,
        });

        await signIn({
          email: data.email,
          password: data.password,
        });
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);
          formRef.current?.setErrors(errors);
          return;
        }
        Alert.alert(
          'Error na autenticação',
          'Ocorreu um error ao fazer login'
        );
      }
    },
    [signIn],
  );

  return (
    <>
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined }
    enabled
    >
    <ScrollView
    keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flex: 1}}
    >
      <Container>
        <Image source={logoImg} />
        <View>
          <Title>Faça seu logon</Title>
        </View>
        <Form ref={formRef} onSubmit={handleSignIn} >
          <Input
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="email-address"
            name="email"
            icon="mail"
            placeholder="E-mail"
            returnKeyType="next"
            onSubmitEditing={() => {
              passwordInputyRef.current?.focus();
              }}
          />
          <Input
            ref={passwordInputyRef}
            name="password"
            icon="lock"
            placeholder="Senha"
            secureTextEntry
            returnKeyType="send"
            onSubmitEditing={() => {
              formRef.current?.submitForm()
              }}
          />
        </Form>
        <Button onPress={() => {
            formRef.current?.submitForm()
            }}
          >
          Entrar
          </Button>
        <ForgotPassword onPress={() => {console.log('esqueci a senha')}}>
          <ForgotPasswordText>Esqueci minha Senha</ForgotPasswordText>
        </ForgotPassword>
    </Container>
  </ScrollView>


    </KeyboardAvoidingView>

    <CreateAccountButton onPress={() => {navigation.navigate('SignUp')}}>
      <Icon name="log-in" size={20} color="#ff9000" />
      <CreateAccountButtonText>Criar uma conta</CreateAccountButtonText>
    </CreateAccountButton>
    </>

  )
}

export default SignIn;


